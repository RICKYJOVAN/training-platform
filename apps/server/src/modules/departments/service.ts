import * as repo from './repository';
import { createError } from '../../middleware/error-handler';

export async function getAllDepartments() {
  return repo.findAllDepartments();
}

export async function getDepartmentById(id: string) {
  const dept = await repo.findDepartmentById(id);
  if (!dept) throw createError('Department not found', 404);
  return dept;
}

export async function createDepartment(name: string) {
  return repo.createDepartment(name);
}
