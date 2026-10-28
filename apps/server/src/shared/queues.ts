import { Queue } from 'bullmq';
import redisClient from './redis';

export const expiryScanQueue = new Queue('expiry-scan', {
  connection: redisClient,
});

export const notificationQueue = new Queue('notifications', {
  connection: redisClient,
});
