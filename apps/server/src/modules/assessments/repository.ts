import { pool } from '../../db/pool';

export interface AssessmentRecord {
  id: string;
  course_id: string;
  pass_score: number;
  max_attempts: number;
}

export interface AssessmentResultRecord {
  id: string;
  assessment_id: string;
  user_id: string;
  score: number | null;
  attempt_no: number | null;
  passed: boolean | null;
  graded_at: Date;
}

export interface AssessmentWithCourse extends AssessmentRecord {
  course_title: string;
  course_category: string | null;
}

export async function findAllAssessments(): Promise<AssessmentWithCourse[]> {
  const { rows } = await pool.query<AssessmentWithCourse>(
    `SELECT a.*, c.title AS course_title, c.category AS course_category
     FROM assessments a
     JOIN courses c ON c.id = a.course_id
     ORDER BY c.title`
  );
  return rows;
}

export async function findAssessmentById(id: string): Promise<AssessmentRecord | null> {
  const { rows } = await pool.query<AssessmentRecord>(
    'SELECT * FROM assessments WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function findAssessmentByCourseId(courseId: string): Promise<AssessmentRecord | null> {
  const { rows } = await pool.query<AssessmentRecord>(
    'SELECT * FROM assessments WHERE course_id = $1', [courseId]
  );
  return rows[0] || null;
}

export async function countAttempts(assessmentId: string, userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM assessment_results WHERE assessment_id = $1 AND user_id = $2',
    [assessmentId, userId]
  );
  return parseInt(rows[0].count, 10);
}

export async function insertResult(
  assessmentId: string,
  userId: string,
  score: number,
  attemptNo: number,
  passed: boolean
): Promise<AssessmentResultRecord> {
  const { rows } = await pool.query<AssessmentResultRecord>(
    `INSERT INTO assessment_results (assessment_id, user_id, score, attempt_no, passed)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [assessmentId, userId, score, attemptNo, passed]
  );
  return rows[0];
}

export async function findResultsByAssessmentId(assessmentId: string): Promise<AssessmentResultRecord[]> {
  const { rows } = await pool.query<AssessmentResultRecord>(
    `SELECT * FROM assessment_results WHERE assessment_id = $1 ORDER BY graded_at DESC`,
    [assessmentId]
  );
  return rows;
}

export async function findPassingResultForUser(
  assessmentId: string,
  userId: string
): Promise<AssessmentResultRecord | null> {
  const { rows } = await pool.query<AssessmentResultRecord>(
    `SELECT * FROM assessment_results WHERE assessment_id = $1 AND user_id = $2 AND passed = true LIMIT 1`,
    [assessmentId, userId]
  );
  return rows[0] || null;
}

export async function createAssessment(
  courseId: string,
  passScore: number,
  maxAttempts: number
): Promise<AssessmentRecord> {
  const { rows } = await pool.query<AssessmentRecord>(
    `INSERT INTO assessments (course_id, pass_score, max_attempts) VALUES ($1, $2, $3) RETURNING *`,
    [courseId, passScore, maxAttempts]
  );
  return rows[0];
}
