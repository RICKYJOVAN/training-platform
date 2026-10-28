import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redisClient from '../../shared/redis';
import { findUserByEmail, findUserById } from './repository';
import { createUser } from '../users/repository';
import { createError } from '../../middleware/error-handler';
import { JwtPayload } from '../../middleware/auth.middleware';
import { UserRole } from '@training-platform/shared-types';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const DENYLIST_PREFIX = 'refresh:deny:';

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as unknown as number,
  });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as unknown as number,
  });
}

export async function registerUser(
  email: string,
  password: string,
  role: UserRole = 'employee',
  department_id?: string,
  manager_id?: string
) {
  // Check if email already exists
  const existing = await findUserByEmail(email);
  if (existing) throw createError('Email already registered', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const user = await createUser({
    email,
    password_hash,
    role,
    department_id,
    manager_id,
  });

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role as UserRole,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);

  await redisClient.setex(`refresh:${user.id}:${refreshToken}`, REFRESH_TOKEN_TTL, '1');

  const { password_hash: _, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: {
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      department_id: safeUser.department_id,
      manager_id: safeUser.manager_id,
      created_at: safeUser.created_at,
    },
  };
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw createError('Invalid credentials', 401);

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role as UserRole,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in Redis for rotation tracking
  await redisClient.setex(`refresh:${user.id}:${refreshToken}`, REFRESH_TOKEN_TTL, '1');

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      manager_id: user.manager_id,
      created_at: user.created_at,
    },
  };
}

export async function refreshTokens(refreshToken: string) {
  // Check denylist
  const isDenied = await redisClient.exists(`${DENYLIST_PREFIX}${refreshToken}`);
  if (isDenied) throw createError('Refresh token revoked', 401);

  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
  } catch {
    throw createError('Invalid refresh token', 401);
  }

  const user = await findUserById(payload.userId);
  if (!user) throw createError('User not found', 401);

  // Rotate: deny old, issue new
  await redisClient.setex(`${DENYLIST_PREFIX}${refreshToken}`, REFRESH_TOKEN_TTL, '1');

  const newAccessToken = signAccessToken({
    userId: user.id,
    role: user.role as UserRole,
    email: user.email,
  });
  const newRefreshToken = signRefreshToken(user.id);
  await redisClient.setex(`refresh:${user.id}:${newRefreshToken}`, REFRESH_TOKEN_TTL, '1');

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string) {
  // Add to denylist
  await redisClient.setex(`${DENYLIST_PREFIX}${refreshToken}`, REFRESH_TOKEN_TTL, '1');
}
