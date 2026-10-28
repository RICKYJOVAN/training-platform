-- 006: Create enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  session_id UUID REFERENCES sessions(id) NOT NULL,
  status enrollment_status DEFAULT 'enrolled',
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, session_id)
);
