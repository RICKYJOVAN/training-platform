-- 009: Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  certification_id UUID REFERENCES certifications(id),
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
