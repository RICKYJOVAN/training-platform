import { pool } from '../../db/pool';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  department_id: string | null;
  manager_id: string | null;
  created_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  role: string;
  department_id?: string;
  manager_id?: string;
}

export async function findAllUsers(): Promise<Omit<UserRecord, 'password_hash'>[]> {
  const { rows } = await pool.query(
    `SELECT id, email, role, department_id, manager_id, created_at
     FROM users ORDER BY email`
  );
  return rows;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(
    'SELECT * FROM users WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function findUsersByManagerId(managerId: string): Promise<Omit<UserRecord, 'password_hash'>[]> {
  const { rows } = await pool.query(
    `SELECT id, email, role, department_id, manager_id, created_at
     FROM users WHERE manager_id = $1 ORDER BY email`,
    [managerId]
  );
  return rows;
}

export async function findUsersByDepartmentId(departmentId: string): Promise<Omit<UserRecord, 'password_hash'>[]> {
  const { rows } = await pool.query(
    `SELECT id, email, role, department_id, manager_id, created_at
     FROM users WHERE department_id = $1 ORDER BY email`,
    [departmentId]
  );
  return rows;
}

export async function createUser(data: CreateUserData): Promise<UserRecord> {
  const { rows } = await pool.query<UserRecord>(
    `INSERT INTO users (email, password_hash, role, department_id, manager_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.email, data.password_hash, data.role, data.department_id || null, data.manager_id || null]
  );
  return rows[0];
}

export async function updateUserRole(id: string, role: string): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
    [role, id]
  );
  return rows[0] || null;
}
