import { pool } from '../../db/pool';
import { ComplianceRow } from '@training-platform/shared-types';

export async function getComplianceReport(departmentId?: string): Promise<ComplianceRow[]> {
  const params: string[] = [];
  const deptFilter = departmentId
    ? `AND u.department_id = $${params.push(departmentId)}`
    : '';

  const { rows } = await pool.query<ComplianceRow>(
    `SELECT
       d.id as department_id,
       d.name as department_name,
       COUNT(DISTINCT u.id)::INT as total_employees,
       COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'active')::INT as certs_active,
       COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'expiring_soon')::INT as certs_expiring_soon,
       COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'expired')::INT as certs_expired,
       ROUND(
         100.0 * COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'active') /
         NULLIF(COUNT(DISTINCT u.id), 0),
         1
       )::FLOAT as compliance_rate
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id ${deptFilter}
     LEFT JOIN certifications cert ON cert.user_id = u.id
     GROUP BY d.id, d.name
     ORDER BY d.name`,
    params
  );
  return rows;
}
