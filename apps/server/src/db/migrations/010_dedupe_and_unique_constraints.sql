-- 010: Dedupe department/course rows created by the old no-op "ON CONFLICT DO NOTHING"
-- in seed.ts (which had no UNIQUE index to actually conflict against), then add the
-- missing UNIQUE constraints so this can never happen again.

-- ── Departments ──────────────────────────────────────────────────────────────
-- For each duplicated name, keep the row with the most users attached to it
-- (ties broken by lowest id) and repoint every other duplicate's users to it.
CREATE TEMP TABLE dept_rank AS
SELECT d.id, d.name,
       ROW_NUMBER() OVER (
         PARTITION BY d.name
         ORDER BY (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) DESC, d.id
       ) AS rn
FROM departments d;

CREATE TEMP TABLE dept_keepers AS
SELECT name, id AS keeper_id FROM dept_rank WHERE rn = 1;

UPDATE users u
SET department_id = k.keeper_id
FROM dept_rank r
JOIN dept_keepers k ON k.name = r.name
WHERE r.rn > 1 AND u.department_id = r.id;

DELETE FROM departments d
USING dept_rank r
WHERE d.id = r.id AND r.rn > 1;

-- ── Courses ──────────────────────────────────────────────────────────────────
-- Same idea: keep the row referenced by the most sessions + assessments +
-- certifications combined, repoint every other duplicate's children to it.
CREATE TEMP TABLE course_rank AS
SELECT c.id, c.title,
       ROW_NUMBER() OVER (
         PARTITION BY c.title
         ORDER BY (
           (SELECT COUNT(*) FROM sessions s WHERE s.course_id = c.id) +
           (SELECT COUNT(*) FROM assessments a WHERE a.course_id = c.id) +
           (SELECT COUNT(*) FROM certifications cert WHERE cert.course_id = c.id)
         ) DESC, c.id
       ) AS rn
FROM courses c;

CREATE TEMP TABLE course_keepers AS
SELECT title, id AS keeper_id FROM course_rank WHERE rn = 1;

UPDATE sessions s
SET course_id = k.keeper_id
FROM course_rank r
JOIN course_keepers k ON k.title = r.title
WHERE r.rn > 1 AND s.course_id = r.id;

UPDATE assessments a
SET course_id = k.keeper_id
FROM course_rank r
JOIN course_keepers k ON k.title = r.title
WHERE r.rn > 1 AND a.course_id = r.id;

-- Before repointing certifications, remove any cert on the duplicate course
-- if a cert for that exact (user_id, course_id, issued_date) already exists on the keeper
DELETE FROM certifications cert
USING course_rank r, course_keepers k
WHERE cert.course_id = r.id
  AND r.rn > 1
  AND k.title = r.title
  AND EXISTS (
    SELECT 1 FROM certifications existing
    WHERE existing.user_id = cert.user_id
      AND existing.course_id = k.keeper_id
      AND existing.issued_date = cert.issued_date
  );

UPDATE certifications cert
SET course_id = k.keeper_id
FROM course_rank r
JOIN course_keepers k ON k.title = r.title
WHERE r.rn > 1 AND cert.course_id = r.id;

DELETE FROM courses c
USING course_rank r
WHERE c.id = r.id AND r.rn > 1;

-- ── Lock it down ─────────────────────────────────────────────────────────────
ALTER TABLE departments ADD CONSTRAINT departments_name_unique UNIQUE (name);
ALTER TABLE courses ADD CONSTRAINT courses_title_unique UNIQUE (title);
