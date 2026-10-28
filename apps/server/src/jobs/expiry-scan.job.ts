import { Worker, Job } from 'bullmq';
import redisClient from '../shared/redis';
import { notificationQueue } from '../shared/queues';
import {
  findExpiringCertifications,
  findExpiredCertifications,
  updateCertificationStatus,
} from '../modules/certifications/repository';

interface NotificationJobData {
  certId: string;
  userId: string;
  tier: '30d' | '15d' | '7d';
}

const TIERS: Array<{ days: number; label: '30d' | '15d' | '7d' }> = [
  { days: 7, label: '7d' },
  { days: 15, label: '15d' },
  { days: 30, label: '30d' },
];

async function runExpiryScan(): Promise<void> {
  console.log('[expiry-scan] Starting scan...');

  // 1. Mark certs past expiry as expired
  const nowExpired = await findExpiredCertifications();
  for (const cert of nowExpired) {
    await updateCertificationStatus(cert.id, 'expired');
    console.log(`[expiry-scan] Marked cert ${cert.id} as expired`);
  }

  // 2. Mark certs expiring within 30 days as expiring_soon
  const expiringSoon = await findExpiringCertifications(30);
  for (const cert of expiringSoon) {
    if (cert.status === 'active') {
      await updateCertificationStatus(cert.id, 'expiring_soon');
      console.log(`[expiry-scan] Marked cert ${cert.id} as expiring_soon`);
    }

    // 3. Enqueue notification jobs for 30/15/7-day tiers
    const now = new Date();
    const expiry = new Date(cert.expiry_date!);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    for (const tier of TIERS) {
      if (daysRemaining <= tier.days) {
        // Dedup: skip if already sent today
        const dedupKey = `notif:${cert.id}:${tier.label}`;
        const alreadySent = await redisClient.exists(dedupKey);
        if (!alreadySent) {
          const jobData: NotificationJobData = {
            certId: cert.id,
            userId: cert.user_id,
            tier: tier.label,
          };
          await notificationQueue.add(`notify-${tier.label}`, jobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          });
          // Set 24h TTL for dedup key
          await redisClient.setex(dedupKey, 86400, '1');
          console.log(`[expiry-scan] Enqueued ${tier.label} notification for cert ${cert.id}`);
        }
      }
    }
  }

  console.log('[expiry-scan] Scan complete.');
}

export const expiryScanWorker = new Worker(
  'expiry-scan',
  async (job: Job) => {
    await runExpiryScan();
  },
  { connection: redisClient }
);

expiryScanWorker.on('completed', (job) => {
  console.log(`[expiry-scan] Job ${job.id} completed`);
});
expiryScanWorker.on('failed', (job, err) => {
  console.error(`[expiry-scan] Job ${job?.id} failed:`, err);
});

export { runExpiryScan };
