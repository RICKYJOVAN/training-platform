import { pool } from '../../db/pool';
import { CreateSessionInput } from '@training-platform/shared-types';

export interface SessionRecord {
  id: string;
  course_id: string;
  instructor_id: string | null;
  start_date: Date;
  end_date: Date | null;
  capacity: number | null;
}

export async function findSessionsByCourseId(courseId: string): Promise<SessionRecord[]> {
  const { rows } = await pool.query<SessionRecord>(
    'SELECT * FROM sessions WHERE course_id = $1 ORDER BY start_date',
    [courseId]
  );
  return rows;
}

export async function findSessionById(id: string): Promise<SessionRecord | null> {
  const { rows } = await pool.query<SessionRecord>(
    'SELECT * FROM sessions WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function createSession(courseId: string, data: CreateSessionInput): Promise<SessionRecord> {
  const { rows } = await pool.query<SessionRecord>(
    `INSERT INTO sessions (course_id, instructor_id, start_date, end_date, capacity)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [courseId, data.instructor_id || null, data.start_date, data.end_date || null, data.capacity || null]
  );
  return rows[0];
}

export async function countEnrollmentsForSession(sessionId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM enrollments
     WHERE session_id = $1 AND status = 'enrolled'`,
    [sessionId]
  );
  return parseInt(rows[0].count, 10);
}
