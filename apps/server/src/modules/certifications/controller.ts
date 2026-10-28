import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export async function getMyCerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.getMyCertifications(req.user!.userId));
  } catch (err) { next(err); }
}

export async function getByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string || 'expiring_soon';
    res.json(await service.getCertificationsByStatus(status, req.user!.role));
  } catch (err) { next(err); }
}

export async function revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cert = await service.revokeCertification(req.params.id, req.user!.role);
    res.json(cert);
  } catch (err) { next(err); }
}
