import { Request, Response, NextFunction } from 'express';
import { CreateCourseSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getAllCourses());
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getCourseById(req.params.id));
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    res.status(201).json(await service.createCourse(parsed.data));
  } catch (err) { next(err); }
}
