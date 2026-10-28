-- 004: Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  validity_months INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
