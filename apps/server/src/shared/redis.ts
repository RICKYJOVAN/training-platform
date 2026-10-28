import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => console.log('[redis] Connected'));
redisClient.on('error', (err) => console.error('[redis] Error:', err));

export default redisClient;
