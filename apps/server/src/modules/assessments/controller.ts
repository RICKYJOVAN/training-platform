import { Request, Response, NextFunction } from 'express';
import { SubmitAssessmentSchema } from '@training-platform/shared-types';
import * as service from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.listAssessments());
  } catch (err) { next(err); }
}

export async function submit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = SubmitAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const result = await service.submitAssessment(
      req.params.id,
      req.user!.userId,
      parsed.data.score
    );
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function results(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getResults(req.params.id));
  } catch (err) { next(err); }
}
