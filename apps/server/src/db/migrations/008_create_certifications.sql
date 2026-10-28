-- 008: Create certifications table with index
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  course_id UUID REFERENCES courses(id) NOT NULL,
  issued_date DATE NOT NULL,
  expiry_date DATE,
  status cert_status DEFAULT 'active',
  UNIQUE(user_id, course_id, issued_date)
);

CREATE INDEX idx_cert_expiry ON certifications(expiry_date) WHERE status != 'expired';
