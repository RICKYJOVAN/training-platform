import bcrypt from 'bcryptjs';
import * as repo from './repository';
import { createError } from '../../middleware/error-handler';
import { UserRole } from '@training-platform/shared-types';

export async function getAllUsers() {
  return repo.findAllUsers();
}

export async function getUserById(id: string) {
  const user = await repo.findUserById(id);
  if (!user) throw createError('User not found', 404);
  const { password_hash: _, ...safe } = user;
  return safe;
}

export async function getReportees(managerId: string) {
  // Manager scoping enforced here at the query level
  return repo.findUsersByManagerId(managerId);
}

export async function createUser(data: {
  email: string;
  password: string;
  role: UserRole;
  department_id?: string;
  manager_id?: string;
}) {
  const password_hash = await bcrypt.hash(data.password, 12);
  const user = await repo.createUser({
    email: data.email,
    password_hash,
    role: data.role,
    department_id: data.department_id,
    manager_id: data.manager_id,
  });
  const { password_hash: _, ...safe } = user;
  return safe;
}

export async function updateRole(requestingRole: UserRole, userId: string, newRole: UserRole) {
  if (requestingRole !== 'hr_admin') {
    throw createError('Only hr_admin can change roles', 403);
  }
  const user = await repo.updateUserRole(userId, newRole);
  if (!user) throw createError('User not found', 404);
  const { password_hash: _, ...safe } = user;
  return safe;
}
