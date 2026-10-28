import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@training-platform/shared-types';

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
}
