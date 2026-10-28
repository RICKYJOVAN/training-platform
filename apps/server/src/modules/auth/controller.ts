import { Request, Response, NextFunction } from 'express';
import { LoginSchema, CreateUserSchema } from '@training-platform/shared-types';
import { loginUser, refreshTokens, logoutUser, registerUser } from './service';

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days ms
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const { email, password, role, department_id, manager_id } = parsed.data;
    const result = await registerUser(email, password, role, department_id, manager_id);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
    res.status(201).json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }
    const tokens = await refreshTokens(refreshToken);
    res.cookie(COOKIE_NAME, tokens.refreshToken, COOKIE_OPTS);
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
