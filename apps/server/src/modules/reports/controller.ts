import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export async function compliance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departmentId = req.query.department_id as string | undefined;
    const report = await service.getComplianceReport(departmentId);
    res.json(report);
  } catch (err) { next(err); }
}
