import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../shared/redis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const redisCommand = (...args: string[]): any => redisClient.call(...args as [string, ...string[]]);

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  store: new RedisStore({
    sendCommand: redisCommand,
  }),
});

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  store: new RedisStore({
    sendCommand: redisCommand,
  }),
});
