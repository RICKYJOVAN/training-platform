import * as repo from './repository';
import { createError } from '../../middleware/error-handler';
import { CreateSessionInput } from '@training-platform/shared-types';
import { findCourseById } from '../courses/repository';

export async function getSessionsByCourse(courseId: string) {
  return repo.findSessionsByCourseId(courseId);
}

export async function createSession(courseId: string, data: CreateSessionInput) {
  const course = await findCourseById(courseId);
  if (!course) throw createError('Course not found', 404);
  return repo.createSession(courseId, data);
}

export async function getEnrollmentCount(sessionId: string): Promise<number> {
  return repo.countEnrollmentsForSession(sessionId);
}

export async function getSessionById(id: string) {
  const session = await repo.findSessionById(id);
  if (!session) throw createError('Session not found', 404);
  return session;
}
