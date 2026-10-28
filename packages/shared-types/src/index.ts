import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum([
  'employee',
  'manager',
  'trainer',
  'hr_admin',
  'compliance_officer',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const CertStatusSchema = z.enum([
  'active',
  'expiring_soon',
  'expired',
  'revoked',
]);
export type CertStatus = z.infer<typeof CertStatusSchema>;

export const EnrollmentStatusSchema = z.enum([
  'enrolled',
  'waitlisted',
  'completed',
  'dropped',
]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

// ─── Department ───────────────────────────────────────────────────────────────

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(120),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

// ─── User ─────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  department_id: z.string().uuid().nullable(),
  manager_id: z.string().uuid().nullable(),
  created_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema.default('employee'),
  department_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ─── Course ───────────────────────────────────────────────────────────────────

export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string().nullable(),
  is_mandatory: z.boolean(),
  version: z.number().int(),
  validity_months: z.number().int().nullable(),
  created_at: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  is_mandatory: z.boolean().default(false),
  validity_months: z.number().int().positive().optional(),
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

// ─── Session ──────────────────────────────────────────────────────────────────

export const SessionSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  instructor_id: z.string().uuid().nullable(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  capacity: z.number().int().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const CreateSessionSchema = z.object({
  instructor_id: z.string().uuid().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  capacity: z.number().int().positive().optional(),
});
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// ─── Enrollment ───────────────────────────────────────────────────────────────

export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid(),
  status: EnrollmentStatusSchema,
  assigned_by: z.string().uuid().nullable(),
});
export type Enrollment = z.infer<typeof EnrollmentSchema>;

export const CreateEnrollmentSchema = z.object({
  user_id: z.string().uuid().optional(), // omit = self-enroll
  session_id: z.string().uuid(),
});
export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>;

// ─── Assessment ───────────────────────────────────────────────────────────────

export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  pass_score: z.number(),
  max_attempts: z.number().int(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export const SubmitAssessmentSchema = z.object({
  score: z.number().min(0).max(100),
});
export type SubmitAssessmentInput = z.infer<typeof SubmitAssessmentSchema>;

export const AssessmentResultSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().nullable(),
  attempt_no: z.number().int().nullable(),
  passed: z.boolean().nullable(),
  graded_at: z.string(),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// ─── Certification ────────────────────────────────────────────────────────────

export const CertificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  issued_date: z.string(),
  expiry_date: z.string().nullable(),
  status: CertStatusSchema,
});
export type Certification = z.infer<typeof CertificationSchema>;

// ─── Notification ─────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  certification_id: z.string().uuid().nullable(),
  type: z.string(),
  sent_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// ─── Report ───────────────────────────────────────────────────────────────────

export const ComplianceRowSchema = z.object({
  department_id: z.string().uuid(),
  department_name: z.string(),
  total_employees: z.number().int(),
  certs_active: z.number().int(),
  certs_expiring_soon: z.number().int(),
  certs_expired: z.number().int(),
  compliance_rate: z.number(),
});
export type ComplianceRow = z.infer<typeof ComplianceRowSchema>;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
