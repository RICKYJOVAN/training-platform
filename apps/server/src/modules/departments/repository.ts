import { pool } from '../../db/pool';

export interface DepartmentRecord {
  id: string;
  name: string;
}

export async function findAllDepartments(): Promise<DepartmentRecord[]> {
  const { rows } = await pool.query<DepartmentRecord>(
    'SELECT * FROM departments ORDER BY name'
  );
  return rows;
}

export async function findDepartmentById(id: string): Promise<DepartmentRecord | null> {
  const { rows } = await pool.query<DepartmentRecord>(
    'SELECT * FROM departments WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function createDepartment(name: string): Promise<DepartmentRecord> {
  const { rows } = await pool.query<DepartmentRecord>(
    'INSERT INTO departments (name) VALUES ($1) RETURNING *',
    [name]
  );
  return rows[0];
}
