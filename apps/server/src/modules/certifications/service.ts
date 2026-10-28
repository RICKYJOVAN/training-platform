import * as repo from './repository';
import { findCourseById } from '../courses/repository';
import { createError } from '../../middleware/error-handler';
import { UserRole } from '@training-platform/shared-types';

function computeExpiryDate(issuedDate: string, validityMonths: number | null): string | null {
  if (!validityMonths) return null;
  const d = new Date(issuedDate);
  d.setMonth(d.getMonth() + validityMonths);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function issueCertificationOnPass(userId: string, courseId: string) {
  const course = await findCourseById(courseId);
  if (!course) return;

  const today = new Date().toISOString().split('T')[0];
  const expiryDate = computeExpiryDate(today, course.validity_months);

  return repo.createCertification(userId, courseId, today, expiryDate);
}

export async function getMyCertifications(userId: string) {
  return repo.findCertificationsByUserId(userId);
}

export async function getCertificationsByStatus(status: string | undefined, requestingRole: UserRole) {
  if (!['manager', 'hr_admin', 'compliance_officer'].includes(requestingRole)) {
    throw createError('Access denied', 403);
  }
  if (!status || status === 'all') {
    return repo.findAllCertifications();
  }
  return repo.findCertificationsByStatus(status);
}

export async function revokeCertification(certId: string, requestingRole: UserRole) {
  if (!['compliance_officer', 'hr_admin'].includes(requestingRole)) {
    throw createError('Only compliance officers and HR administrators can revoke certifications', 403);
  }
  const cert = await repo.findCertificationById(certId);
  if (!cert) throw createError('Certification not found', 404);
  if (cert.status === 'revoked') throw createError('Already revoked', 409);

  return repo.updateCertificationStatus(certId, 'revoked');
}
