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

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}
