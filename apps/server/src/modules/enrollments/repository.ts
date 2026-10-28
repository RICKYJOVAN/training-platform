import { pool } from '../../db/pool';

export interface EnrollmentRecord {
  id: string;
  user_id: string;
  session_id: string;
  status: string;
  assigned_by: string | null;
}

export interface EnrollmentWithDetails extends EnrollmentRecord {
  course_title: string;
  course_id: string;
  start_date: Date;
  end_date: Date | null;
}

export async function findEnrollmentsByUserId(userId: string): Promise<EnrollmentWithDetails[]> {
  const { rows } = await pool.query<EnrollmentWithDetails>(
    `SELECT e.*, c.title as course_title, c.id as course_id, s.start_date, s.end_date
     FROM enrollments e
     JOIN sessions s ON s.id = e.session_id
     JOIN courses c ON c.id = s.course_id
     WHERE e.user_id = $1
     ORDER BY s.start_date DESC`,
    [userId]
  );
  return rows;
}

export async function findEnrollmentById(id: string): Promise<EnrollmentRecord | null> {
  const { rows } = await pool.query<EnrollmentRecord>(
    'SELECT * FROM enrollments WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function createEnrollment(
  userId: string,
  sessionId: string,
  status: string,
  assignedBy?: string
): Promise<EnrollmentRecord> {
  const { rows } = await pool.query<EnrollmentRecord>(
    `INSERT INTO enrollments (user_id, session_id, status, assigned_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, sessionId, status, assignedBy || null]
  );
  return rows[0];
}

export async function updateEnrollmentStatus(
  id: string,
  status: string
): Promise<EnrollmentRecord | null> {
  const { rows } = await pool.query<EnrollmentRecord>(
    'UPDATE enrollments SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] || null;
}

export async function findExistingEnrollment(
  userId: string,
  sessionId: string
): Promise<EnrollmentRecord | null> {
  const { rows } = await pool.query<EnrollmentRecord>(
    'SELECT * FROM enrollments WHERE user_id = $1 AND session_id = $2',
    [userId, sessionId]
  );
  return rows[0] || null;
}
