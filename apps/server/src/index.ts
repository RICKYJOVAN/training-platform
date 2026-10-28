import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/error-handler';
import { globalRateLimiter, authRateLimiter } from './middleware/rate-limit.middleware';
import { requireAuth } from './middleware/auth.middleware';
import { requireRole } from './middleware/rbac.middleware';

// Module controllers
import * as authCtrl from './modules/auth/controller';
import * as userCtrl from './modules/users/controller';
import * as deptCtrl from './modules/departments/controller';
import * as courseCtrl from './modules/courses/controller';
import * as sessionCtrl from './modules/sessions/controller';
import * as enrollCtrl from './modules/enrollments/controller';
import * as assessmentCtrl from './modules/assessments/controller';
import * as certCtrl from './modules/certifications/controller';
import * as reportCtrl from './modules/reports/controller';

// BullMQ jobs and scheduler
import { expiryScanQueue } from './shared/queues';
import './jobs/expiry-scan.job';
import './jobs/notification-dispatch.job';

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(globalRateLimiter);

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', authRateLimiter, authCtrl.register);
app.post('/api/auth/login', authRateLimiter, authCtrl.login);
app.post('/api/auth/refresh', authRateLimiter, authCtrl.refresh);
app.post('/api/auth/logout', authRateLimiter, authCtrl.logout);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// Users
app.get('/api/users/me', requireAuth, userCtrl.getMe);
app.get('/api/users/reportees', requireAuth, requireRole(['manager']), userCtrl.getMyReportees);
app.get('/api/users', requireAuth, requireRole(['hr_admin', 'manager', 'compliance_officer']), userCtrl.list);
app.post('/api/users', requireAuth, requireRole(['hr_admin']), userCtrl.create);
app.get('/api/users/:id', requireAuth, userCtrl.getById);
app.patch('/api/users/:id/role', requireAuth, requireRole(['hr_admin']), userCtrl.updateRole);

// Departments
app.get('/api/departments', deptCtrl.list);
app.get('/api/departments/:id', requireAuth, deptCtrl.getById);
app.post('/api/departments', requireAuth, requireRole(['hr_admin']), deptCtrl.create);

// Courses
app.get('/api/courses', requireAuth, courseCtrl.list);
app.post('/api/courses', requireAuth, requireRole(['hr_admin']), courseCtrl.create);
app.get('/api/courses/:id', requireAuth, courseCtrl.getById);

// Sessions
app.get('/api/sessions', requireAuth, sessionCtrl.list);
app.post('/api/sessions/:courseId', requireAuth, requireRole(['trainer', 'hr_admin']), sessionCtrl.create);

// Enrollments
app.get('/api/enrollments/me', requireAuth, enrollCtrl.getMyEnrollments);
app.post('/api/enrollments', requireAuth, enrollCtrl.create);
app.patch('/api/enrollments/:id/complete', requireAuth, enrollCtrl.complete);
app.patch('/api/enrollments/:id/drop', requireAuth, enrollCtrl.drop);

// Assessments
app.get('/api/assessments', requireAuth, assessmentCtrl.list);
app.post('/api/assessments/:id/submit', requireAuth, assessmentCtrl.submit);
app.get('/api/assessments/:id/results', requireAuth, requireRole(['trainer', 'hr_admin']), assessmentCtrl.results);

// Certifications
app.get('/api/certifications/me', requireAuth, certCtrl.getMyCerts);
app.get('/api/certifications', requireAuth, requireRole(['manager', 'hr_admin', 'compliance_officer']), certCtrl.getByStatus);
app.post('/api/certifications/:id/revoke', requireAuth, requireRole(['compliance_officer', 'hr_admin']), certCtrl.revoke);

// Reports
app.get('/api/reports/compliance', requireAuth, requireRole(['manager', 'hr_admin', 'compliance_officer']), reportCtrl.compliance);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server & Schedule Jobs ────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function startServer() {
  // Register daily expiry scan repeatable job at 00:00
  await expiryScanQueue.add(
    'daily-expiry-scan',
    {},
    {
      repeat: { pattern: '0 0 * * *' },
      jobId: 'daily-expiry-scan',
    }
  );
  console.log('[scheduler] Daily expiry scan job registered');

  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
