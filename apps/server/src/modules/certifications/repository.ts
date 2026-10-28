import { pool } from '../../db/pool';

export interface CertificationRecord {
  id: string;
  user_id: string;
  course_id: string;
  issued_date: Date;
  expiry_date: Date | null;
  status: string;
}

export interface CertificationWithDetails extends CertificationRecord {
  course_title: string;
  user_email: string;
  department_id: string | null;
}

export async function findCertificationsByUserId(userId: string): Promise<CertificationWithDetails[]> {
  const { rows } = await pool.query<CertificationWithDetails>(
    `SELECT cert.*, c.title as course_title, u.email as user_email, u.department_id
     FROM certifications cert
     JOIN courses c ON c.id = cert.course_id
     JOIN users u ON u.id = cert.user_id
     WHERE cert.user_id = $1
     ORDER BY cert.issued_date DESC`,
    [userId]
  );
  return rows;
}

export async function findCertificationsByStatus(status: string): Promise<CertificationWithDetails[]> {
  const { rows } = await pool.query<CertificationWithDetails>(
    `SELECT cert.*, c.title as course_title, u.email as user_email, u.department_id
     FROM certifications cert
     JOIN courses c ON c.id = cert.course_id
     JOIN users u ON u.id = cert.user_id
     WHERE cert.status = $1
     ORDER BY cert.expiry_date ASC`,
    [status]
  );
  return rows;
}

export async function findAllCertifications(): Promise<CertificationWithDetails[]> {
  const { rows } = await pool.query<CertificationWithDetails>(
    `SELECT cert.*, c.title as course_title, u.email as user_email, u.department_id
     FROM certifications cert
     JOIN courses c ON c.id = cert.course_id
     JOIN users u ON u.id = cert.user_id
     ORDER BY cert.expiry_date ASC NULLS LAST`
  );
  return rows;
}

export async function findExpiringCertifications(daysAhead: number): Promise<CertificationRecord[]> {
  const { rows } = await pool.query<CertificationRecord>(
    `SELECT * FROM certifications
     WHERE expiry_date <= now() + ($1 || ' days')::INTERVAL
       AND expiry_date > now()
       AND status IN ('active', 'expiring_soon')`,
    [daysAhead]
  );
  return rows;
}

export async function findExpiredCertifications(): Promise<CertificationRecord[]> {
  const { rows } = await pool.query<CertificationRecord>(
    `SELECT * FROM certifications
     WHERE expiry_date < now()::DATE
       AND status != 'expired'
       AND status != 'revoked'`
  );
  return rows;
}

export async function createCertification(
  userId: string,
  courseId: string,
  issuedDate: string,
  expiryDate: string | null
): Promise<CertificationRecord> {
  const { rows } = await pool.query<CertificationRecord>(
    `INSERT INTO certifications (user_id, course_id, issued_date, expiry_date, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (user_id, course_id, issued_date) DO NOTHING
     RETURNING *`,
    [userId, courseId, issuedDate, expiryDate]
  );
  return rows[0];
}

export async function updateCertificationStatus(
  id: string,
  status: string
): Promise<CertificationRecord | null> {
  const { rows } = await pool.query<CertificationRecord>(
    'UPDATE certifications SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] || null;
}

export async function findCertificationById(id: string): Promise<CertificationRecord | null> {
  const { rows } = await pool.query<CertificationRecord>(
    'SELECT * FROM certifications WHERE id = $1', [id]
  );
  return rows[0] || null;
}

export async function insertNotification(
  userId: string,
  certificationId: string,
  type: string
): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, certification_id, type) VALUES ($1, $2, $3)`,
    [userId, certificationId, type]
  );
}
