import * as repo from './repository';
import { createError } from '../../middleware/error-handler';
import { CreateCourseInput } from '@training-platform/shared-types';

export async function getAllCourses() {
  return repo.findAllCourses();
}

export async function getCourseById(id: string) {
  const course = await repo.findCourseById(id);
  if (!course) throw createError('Course not found', 404);
  return course;
}

export async function createCourse(data: CreateCourseInput) {
  return repo.createCourse(data);
}
