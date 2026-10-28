import { Worker, Job } from 'bullmq';
import redisClient from '../shared/redis';
import { insertNotification } from '../modules/certifications/repository';

interface NotificationJobData {
  certId: string;
  userId: string;
  tier: '30d' | '15d' | '7d';
}

const tierLabels: Record<string, string> = {
  '30d': 'CERT_EXPIRING_30D',
  '15d': 'CERT_EXPIRING_15D',
  '7d': 'CERT_EXPIRING_7D',
};

export const notificationWorker = new Worker(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const { certId, userId, tier } = job.data;
    const notifType = tierLabels[tier] || 'CERT_EXPIRING';

    // Insert notification record to DB (represents email/push dispatch)
    await insertNotification(userId, certId, notifType);

    console.log(`[notifications] Dispatched ${notifType} to user ${userId} for cert ${certId}`);
  },
  { connection: redisClient }
);

notificationWorker.on('completed', (job) => {
  console.log(`[notifications] Job ${job.id} completed`);
});
notificationWorker.on('failed', (job, err) => {
  console.error(`[notifications] Job ${job?.id} failed:`, err);
});
