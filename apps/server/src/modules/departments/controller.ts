import { Request, Response, NextFunction } from 'express';
import { CreateDepartmentSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const depts = await service.getAllDepartments();
    res.json(depts);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dept = await service.getDepartmentById(req.params.id);
    res.json(dept);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const dept = await service.createDepartment(parsed.data.name);
    res.status(201).json(dept);
  } catch (err) { next(err); }
}
