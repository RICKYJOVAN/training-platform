-- 007: Create assessments and assessment_results tables
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) NOT NULL,
  pass_score NUMERIC(5,2) NOT NULL,
  max_attempts INT DEFAULT 3
);

CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  score NUMERIC(5,2),
  attempt_no INT,
  passed BOOLEAN,
  graded_at TIMESTAMPTZ DEFAULT now()
);
