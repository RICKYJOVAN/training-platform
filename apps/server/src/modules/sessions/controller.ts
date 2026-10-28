import { Request, Response, NextFunction } from 'express';
import { CreateSessionSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = req.query.course_id as string | undefined;
    if (!courseId) {
      res.status(400).json({ message: 'course_id query parameter is required' });
      return;
    }
    res.json(await service.getSessionsByCourse(courseId));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const session = await service.createSession(req.params.courseId, parsed.data);
    res.status(201).json(session);
  } catch (err) { next(err); }
}
