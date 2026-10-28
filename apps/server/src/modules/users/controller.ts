import { Request, Response, NextFunction } from 'express';
import { CreateUserSchema, UserRoleSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await service.getAllUsers();
    res.json(users);
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await service.getUserById(req.user!.userId);
    res.json(user);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await service.getUserById(req.params.id);
    res.json(user);
  } catch (err) { next(err); }
}

export async function getMyReportees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reportees = await service.getReportees(req.user!.userId);
    res.json(reportees);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const user = await service.createUser(parsed.data);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = UserRoleSchema.safeParse(req.body.role);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    const user = await service.updateRole(req.user!.role, req.params.id, parsed.data);
    res.json(user);
  } catch (err) { next(err); }
}
