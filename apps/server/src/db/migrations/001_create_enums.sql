-- 001: Create custom ENUM types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'trainer', 'hr_admin', 'compliance_officer');
CREATE TYPE cert_status AS ENUM ('active', 'expiring_soon', 'expired', 'revoked');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'waitlisted', 'completed', 'dropped');
