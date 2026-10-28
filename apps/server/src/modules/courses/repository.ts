import { pool } from '../../db/pool';
import { CreateCourseInput } from '@training-platform/shared-types';

export interface CourseRecord {
  id: string;
  title: string;
  category: string | null;
  is_mandatory: boolean;
  version: number;
  validity_months: number | null;
  created_at: Date;
}

export async function findAllCourses(): Promise<CourseRecord[]> {
  const { rows } = await pool.query<CourseRecord>(
    'SELECT * FROM courses ORDER BY title'
  );
  return rows;
}

export async function findCourseById(id: string): Promise<CourseRecord | null> {
  const { rows } = await pool.query<CourseRecord>(
    'SELECT * FROM courses WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function createCourse(data: CreateCourseInput): Promise<CourseRecord> {
  const { rows } = await pool.query<CourseRecord>(
    `INSERT INTO courses (title, category, is_mandatory, validity_months)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.title, data.category || null, data.is_mandatory ?? false, data.validity_months || null]
  );
  return rows[0];
}
