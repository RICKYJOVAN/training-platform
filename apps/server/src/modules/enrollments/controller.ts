import { Request, Response, NextFunction } from 'express';
import { CreateEnrollmentSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getMyEnrollments(req.user!.userId));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateEnrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const enrollment = await service.enroll(
      req.user!.userId,
      req.user!.role,
      parsed.data.user_id,
      parsed.data.session_id
    );
    res.status(201).json(enrollment);
  } catch (err) { next(err); }
}

export async function complete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollment = await service.completeEnrollment(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    res.json(enrollment);
  } catch (err) { next(err); }
}

export async function drop(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollment = await service.dropEnrollment(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    res.json(enrollment);
  } catch (err) { next(err); }
}
