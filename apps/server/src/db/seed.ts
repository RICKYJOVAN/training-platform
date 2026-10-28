import bcrypt from 'bcryptjs';
import { pool } from './pool';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const client = await pool.connect();
  console.log('[seed] Starting...');

  try {
    await client.query('BEGIN');

    // ─── Departments ─────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO departments (name) VALUES
        ('Engineering'),
        ('Operations'),
        ('Compliance & Risk')
      ON CONFLICT DO NOTHING
    `);

    const deptsResult = await client.query(`SELECT id, name FROM departments`);
    const deptMap: Record<string, string> = {};
    deptsResult.rows.forEach((d: { id: string; name: string }) => { deptMap[d.name] = d.id; });
    const engDeptId = deptMap['Engineering'];
    const opsDeptId = deptMap['Operations'];
    const compDeptId = deptMap['Compliance & Risk'];
    console.log('[seed] Departments created');

    // ─── Users ───────────────────────────────────────────────────────────────
    const hash = await bcrypt.hash('Password123!', 12);

    await client.query(`
      INSERT INTO users (email, password_hash, role, department_id) VALUES
        ('hr.admin@company.com',          $1, 'hr_admin',            $2),
        ('compliance@company.com',        $1, 'compliance_officer',  $4),
        ('trainer.alice@company.com',     $1, 'trainer',             $2),
        ('trainer.bob@company.com',       $1, 'trainer',             $3),
        ('mgr.chen@company.com',          $1, 'manager',             $2),
        ('mgr.diaz@company.com',          $1, 'manager',             $3),
        ('emp.1@company.com',             $1, 'employee',            $2),
        ('emp.2@company.com',             $1, 'employee',            $2),
        ('emp.3@company.com',             $1, 'employee',            $2),
        ('emp.4@company.com',             $1, 'employee',            $2),
        ('emp.5@company.com',             $1, 'employee',            $3),
        ('emp.6@company.com',             $1, 'employee',            $3),
        ('emp.7@company.com',             $1, 'employee',            $3),
        ('emp.8@company.com',             $1, 'employee',            $3),
        ('emp.9@company.com',             $1, 'employee',            $4),
        ('emp.10@company.com',            $1, 'employee',            $4),
        ('emp.11@company.com',            $1, 'employee',            $4),
        ('emp.12@company.com',            $1, 'employee',            $2),
        ('emp.13@company.com',            $1, 'employee',            $3),
        ('emp.14@company.com',            $1, 'employee',            $4)
      ON CONFLICT (email) DO NOTHING
    `, [hash, engDeptId, opsDeptId, compDeptId]);

    const usersResult = await client.query(`SELECT id, email, role FROM users`);
    const userMap: Record<string, string> = {};
    usersResult.rows.forEach((u: { id: string; email: string }) => { userMap[u.email] = u.id; });

    // Set manager_id for employees
    await client.query(`
      UPDATE users SET manager_id = $1 WHERE email IN (
        'emp.1@company.com','emp.2@company.com','emp.3@company.com','emp.4@company.com','emp.12@company.com'
      )
    `, [userMap['mgr.chen@company.com']]);
    await client.query(`
      UPDATE users SET manager_id = $1 WHERE email IN (
        'emp.5@company.com','emp.6@company.com','emp.7@company.com','emp.8@company.com','emp.13@company.com'
      )
    `, [userMap['mgr.diaz@company.com']]);

    console.log('[seed] Users created');

    // ─── Courses ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO courses (title, category, is_mandatory, validity_months) VALUES
        ('Fire Safety & Emergency Procedures',     'Health & Safety',   true,  12),
        ('Data Protection & GDPR Compliance',      'Compliance',        true,  24),
        ('Workplace Harassment Prevention',         'HR Compliance',     true,  24),
        ('Information Security Fundamentals',      'IT Security',       true,  12),
        ('Leadership Essentials for Managers',     'Leadership',        false, 36),
        ('Advanced Risk Assessment Techniques',    'Risk Management',   false, null)
      ON CONFLICT DO NOTHING
    `);

    const coursesResult = await client.query(`SELECT id, title, validity_months FROM courses`);
    const courseMap: Record<string, { id: string; validity_months: number | null }> = {};
    coursesResult.rows.forEach((c: { id: string; title: string; validity_months: number | null }) => {
      courseMap[c.title] = { id: c.id, validity_months: c.validity_months };
    });

    console.log('[seed] Courses created');

    // ─── Assessments ─────────────────────────────────────────────────────────
    for (const [title, { id }] of Object.entries(courseMap)) {
      if (title !== 'Advanced Risk Assessment Techniques') {
        await client.query(`
          INSERT INTO assessments (course_id, pass_score, max_attempts)
          VALUES ($1, 70, 3)
          ON CONFLICT DO NOTHING
        `, [id]);
      }
    }
    console.log('[seed] Assessments created');

    // ─── Sessions ────────────────────────────────────────────────────────────
    const fireSafetyCourseId = courseMap['Fire Safety & Emergency Procedures'].id;
    const gdprCourseId = courseMap['Data Protection & GDPR Compliance'].id;
    const infoSecCourseId = courseMap['Information Security Fundamentals'].id;
    const trainerAliceId = userMap['trainer.alice@company.com'];
    const trainerBobId = userMap['trainer.bob@company.com'];

    const sessions = await client.query(`
      INSERT INTO sessions (course_id, instructor_id, start_date, end_date, capacity) VALUES
        ($1, $4, '2026-08-01 09:00:00+00', '2026-08-01 17:00:00+00', 20),
        ($1, $4, '2026-10-15 09:00:00+00', '2026-10-15 17:00:00+00', 20),
        ($2, $5, '2026-07-15 10:00:00+00', '2026-07-15 16:00:00+00', 30),
        ($2, $5, '2026-11-01 10:00:00+00', '2026-11-01 16:00:00+00', 30),
        ($3, $4, '2026-09-01 09:00:00+00', '2026-09-01 13:00:00+00', 25)
      RETURNING id, course_id
    `, [fireSafetyCourseId, gdprCourseId, infoSecCourseId, trainerAliceId, trainerBobId]);

    console.log('[seed] Sessions created');

    // ─── Certifications (mixed statuses for demo) ─────────────────────────────
    // Helper to add months
    const addMonths = (dateStr: string, months: number) => {
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    };

    const certData: Array<{ userId: string; courseTitle: string; issuedDate: string }> = [
      // Active certs
      { userId: userMap['emp.1@company.com'], courseTitle: 'Fire Safety & Emergency Procedures', issuedDate: '2026-04-01' },
      { userId: userMap['emp.2@company.com'], courseTitle: 'Fire Safety & Emergency Procedures', issuedDate: '2026-05-01' },
      { userId: userMap['emp.1@company.com'], courseTitle: 'Data Protection & GDPR Compliance', issuedDate: '2025-12-01' },
      { userId: userMap['emp.3@company.com'], courseTitle: 'Data Protection & GDPR Compliance', issuedDate: '2026-01-15' },
      { userId: userMap['emp.5@company.com'], courseTitle: 'Information Security Fundamentals', issuedDate: '2026-06-01' },
      // Expiring soon (within 30 days from today 2026-09-15)
      { userId: userMap['emp.4@company.com'], courseTitle: 'Fire Safety & Emergency Procedures', issuedDate: '2025-09-20' },
      { userId: userMap['emp.6@company.com'], courseTitle: 'Fire Safety & Emergency Procedures', issuedDate: '2025-09-28' },
      { userId: userMap['emp.7@company.com'], courseTitle: 'Data Protection & GDPR Compliance', issuedDate: '2024-09-25' },
      // Expired
      { userId: userMap['emp.8@company.com'], courseTitle: 'Fire Safety & Emergency Procedures', issuedDate: '2025-07-01' },
      { userId: userMap['emp.9@company.com'], courseTitle: 'Information Security Fundamentals', issuedDate: '2025-08-01' },
      { userId: userMap['emp.10@company.com'], courseTitle: 'Data Protection & GDPR Compliance', issuedDate: '2024-06-01' },
    ];

    for (const { userId, courseTitle, issuedDate } of certData) {
      const course = courseMap[courseTitle];
      if (!course) continue;
      const expiryDate = course.validity_months
        ? addMonths(issuedDate, course.validity_months)
        : null;

      // Determine status based on expiry vs today (2026-09-15)
      let status = 'active';
      if (expiryDate) {
        const expiry = new Date(expiryDate);
        const today = new Date('2026-09-15');
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft <= 30) status = 'expiring_soon';
      }

      await client.query(`
        INSERT INTO certifications (user_id, course_id, issued_date, expiry_date, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, course_id, issued_date) DO NOTHING
      `, [userId, course.id, issuedDate, expiryDate, status]);
    }

    console.log('[seed] Certifications created');

    await client.query('COMMIT');
    console.log('[seed] ✓ Done!');
    console.log('\nDemo login credentials (all use password: Password123!):');
    console.log('  hr_admin:           hr.admin@company.com');
    console.log('  compliance_officer: compliance@company.com');
    console.log('  trainer:            trainer.alice@company.com');
    console.log('  manager:            mgr.chen@company.com');
    console.log('  employee:           emp.1@company.com');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
