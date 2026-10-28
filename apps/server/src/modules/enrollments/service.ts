import * as repo from './repository';
import { countEnrollmentsForSession, findSessionById } from '../sessions/repository';
import { createError } from '../../middleware/error-handler';
import { UserRole } from '@training-platform/shared-types';

export async function getMyEnrollments(userId: string) {
  return repo.findEnrollmentsByUserId(userId);
}

export async function enroll(
  requestingUserId: string,
  requestingRole: UserRole,
  targetUserId: string | undefined,
  sessionId: string
) {
  // Determine who is being enrolled
  const enrollUserId = targetUserId || requestingUserId;

  // Only managers and hr_admin can enroll others
  if (enrollUserId !== requestingUserId) {
    if (!['manager', 'hr_admin'].includes(requestingRole)) {
      throw createError('Cannot enroll another user', 403);
    }
  }

  // Check for duplicate enrollment
  const existing = await repo.findExistingEnrollment(enrollUserId, sessionId);
  if (existing) throw createError('Already enrolled in this session', 409);

  // Check session capacity
  const session = await findSessionById(sessionId);
  if (!session) throw createError('Session not found', 404);

  let status = 'enrolled';
  if (session.capacity !== null) {
    const count = await countEnrollmentsForSession(sessionId);
    if (count >= session.capacity) {
      status = 'waitlisted';
    }
  }

  const assignedBy = enrollUserId !== requestingUserId ? requestingUserId : undefined;
  return repo.createEnrollment(enrollUserId, sessionId, status, assignedBy);
}

export async function completeEnrollment(enrollmentId: string, requestingUserId: string, requestingRole: UserRole) {
  const enrollment = await repo.findEnrollmentById(enrollmentId);
  if (!enrollment) throw createError('Enrollment not found', 404);

  // Only the enrolled user, their manager, trainer, or hr_admin can complete
  const canComplete =
    enrollment.user_id === requestingUserId ||
    ['manager', 'trainer', 'hr_admin'].includes(requestingRole);

  if (!canComplete) throw createError('Cannot complete this enrollment', 403);

  if (enrollment.status === 'completed') {
    throw createError('Enrollment already completed', 409);
  }

  return repo.updateEnrollmentStatus(enrollmentId, 'completed');
}

export async function dropEnrollment(enrollmentId: string, requestingUserId: string, requestingRole: UserRole) {
  const enrollment = await repo.findEnrollmentById(enrollmentId);
  if (!enrollment) throw createError('Enrollment not found', 404);

  const canDrop =
    enrollment.user_id === requestingUserId ||
    ['manager', 'hr_admin'].includes(requestingRole);

  if (!canDrop) throw createError('Cannot drop this enrollment', 403);
  if (enrollment.status === 'completed') {
    throw createError('Cannot drop a completed enrollment', 400);
  }

  return repo.updateEnrollmentStatus(enrollmentId, 'dropped');
}
