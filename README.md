# Training & Certification Registry — Project Documentation

## What This Is

A full-stack **Employee Training & Certification Management Platform** built as a full-stack developer college mini project. It manages employee training courses, session enrollments, assessment scoring, and compliance certifications across departments — with role-based access for different staff types.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript, Vite, Zustand (state), React Router v6 |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (via `pg` pool) |
| **Cache / Jobs** | Redis + BullMQ (job queues) |
| **Auth** | JWT (access + refresh tokens), bcryptjs, HTTP-only cookies |
| **Shared Types** | Zod schemas as a shared monorepo package |
| **Containerisation** | Docker + Docker Compose |

---

## Project Structure

```
training-platform/
├── apps/
│   ├── client/          # React/Vite frontend
│   │   └── src/
│   │       ├── api/         # All API fetch functions
│   │       ├── components/  # AppShell, ProtectedLayout
│   │       ├── features/    # auth, courses, enrollments, certifications, assessments, reports
│   │       ├── store/       # Zustand auth store
│   │       └── styles/      # CSS design tokens + global styles
│   └── server/          # Express backend
│       └── src/
│           ├── db/          # PostgreSQL pool, migrations, seed
│           ├── jobs/        # BullMQ background jobs (expiry scan, notifications)
│           ├── middleware/  # auth (JWT), RBAC, error handler, rate limiter
│           ├── modules/     # auth, users, departments, courses, sessions,
│           │                #  enrollments, assessments, certifications, reports
│           └── shared/      # Redis client, BullMQ queue definitions
└── packages/
    └── shared-types/    # Zod schemas + TypeScript types shared by both apps
```

---

## User Roles & Permissions

| Role | What They Can Do |
|------|-----------------|
| `employee` | View own certifications, enrollments; submit assessments |
| `manager` | Everything employee can + view team certifications & reports |
| `trainer` | Submit assessments + view all assessment results |
| `hr_admin` | Full access — create courses, users, departments; view all data |
| `compliance_officer` | View all certifications, compliance reports; revoke certifications |

---

## Authentication System

- **Login** → POST `/api/auth/login` — validates credentials, returns JWT access token (15 min) + sets HTTP-only refresh token cookie (7 days)
- **Register** → POST `/api/auth/register` — creates account, logs in immediately with tokens
- **Refresh** → POST `/api/auth/refresh` — rotates refresh token, issues new access token
- **Logout** → POST `/api/auth/logout` — adds refresh token to Redis denylist

Access tokens are stored in Zustand memory (not localStorage). Refresh tokens are HTTP-only cookies.

---

## API Endpoints

### Auth (public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account + auto login |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |

### Departments (list is public for signup)
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/departments` | No |
| GET | `/api/departments/:id` | Yes |
| POST | `/api/departments` | hr_admin only |

### Users
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/users/me` | Any authenticated |
| GET | `/api/users/reportees` | manager |
| GET | `/api/users` | hr_admin, manager, compliance_officer |
| POST | `/api/users` | hr_admin |
| GET | `/api/users/:id` | Any authenticated |
| PATCH | `/api/users/:id/role` | hr_admin |

### Courses
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/courses` | Any authenticated |
| POST | `/api/courses` | hr_admin |
| GET | `/api/courses/:id` | Any authenticated |

### Sessions
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/sessions` | Any authenticated |
| POST | `/api/sessions/:courseId` | trainer, hr_admin |

### Enrollments
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/enrollments/me` | Any authenticated |
| POST | `/api/enrollments` | Any authenticated |
| PATCH | `/api/enrollments/:id/complete` | Any authenticated |

### Assessments
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/assessments` | Any authenticated |
| POST | `/api/assessments/:id/submit` | Any authenticated |
| GET | `/api/assessments/:id/results` | trainer, hr_admin |

### Certifications
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/certifications/me` | Any authenticated |
| GET | `/api/certifications` | manager, hr_admin, compliance_officer |
| POST | `/api/certifications/:id/revoke` | compliance_officer |

### Reports
| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/reports/compliance` | manager, hr_admin, compliance_officer |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Email + password login. Links to signup. |
| `/signup` | SignupPage | Register new user with role + department selection |
| `/certifications` | CertificationsPage | My certs (employees) or expiring-soon org view (managers+) |
| `/enrollments` | EnrollmentsPage | My session enrollments; mark complete |
| `/courses` | CoursesPage | Course catalogue; hr_admin can add courses |
| `/assessments` | AssessmentsPage | Dropdown list of real assessments; submit score |
| `/reports` | ReportsPage | Compliance dashboard (manager+ only), department filter |

---

## Database Schema (PostgreSQL)

Tables created by migrations in `apps/server/src/db/migrations/`:

- **departments** — id, name
- **users** — id, email, password_hash, role, department_id, manager_id, created_at
- **courses** — id, title, category, is_mandatory, version, validity_months, created_at
- **sessions** — id, course_id, instructor_id, start_date, end_date, capacity
- **enrollments** — id, user_id, session_id, status, assigned_by
- **assessments** — id, course_id, pass_score, max_attempts
- **assessment_results** — id, assessment_id, user_id, score, attempt_no, passed, graded_at
- **certifications** — id, user_id, course_id, issued_date, expiry_date, status
- **notifications** — id, user_id, certification_id, type, sent_at

---

## Background Jobs (BullMQ + Redis)

| Job | Schedule | What it does |
|-----|----------|-------------|
| `daily-expiry-scan` | 00:00 every day | Scans certifications; marks expired ones, queues notifications |
| `notification-dispatch` | Triggered by expiry scan | Sends (logs) expiry notifications per user |

---

## Running Locally

### Prerequisites
- Node.js 18+
- Docker + Docker Compose (for PostgreSQL + Redis)

### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migrations + Seed
```bash
cd apps/server
npx ts-node src/db/migrate.ts
npx ts-node src/db/seed.ts
```

### 4. Start Backend
```bash
# In apps/server/
npm run dev
# Runs on http://localhost:4000
```

### 5. Start Frontend
```bash
# In apps/client/
npm run dev
# Runs on http://localhost:5173
```

---

## Demo Credentials (from seed data)

All accounts use password: `Password123!`

| Email | Role |
|-------|------|
| `hr.admin@company.com` | hr_admin |
| `compliance@company.com` | compliance_officer |
| `trainer.alice@company.com` | trainer |
| `mgr.chen@company.com` | manager |
| `emp.1@company.com` | employee |

Or create a new account at `/signup`.

---

## What Was Built — Full History

### Phase 1 — Backend Architecture
- Express server with modular controller/service/repository pattern for all 9 domains
- PostgreSQL with migrations for all tables
- JWT auth with refresh token rotation stored in Redis
- RBAC middleware (`requireRole`)
- Rate limiting (global + auth-specific)
- BullMQ job queues for daily certification expiry scanning + notification dispatch

### Phase 2 — Shared Types Package
- Monorepo `packages/shared-types` with Zod schemas for all entities
- Used for both server-side validation and client-side TypeScript types

### Phase 3 — Frontend Foundation
- Vite + React 18 + TypeScript
- CSS design system with custom properties (tokens.css + global.css) — no Tailwind
- Zustand auth store with in-memory access tokens
- `apiFetch` with automatic JWT refresh on 401 + request queue during refresh

### Phase 4 — Feature Pages
- Certifications, Enrollments, Courses, Assessments, Reports pages
- Role-aware UI (different views depending on user role)
- AppShell with sticky tab navigation + role-filtered menu items

### Phase 5 — Bug Fixes (this session)

| # | Bug / Gap | Fix Applied |
|---|-----------|------------|
| 1 | **No sign up page** — only demo logins | Created `SignupPage.tsx` at `/signup` with email, password (+ confirm), role selector, and department dropdown |
| 2 | **No register endpoint** on server | Added `POST /api/auth/register` to `index.ts`; added `register()` to `auth/controller.ts` and `auth/service.ts` |
| 3 | **No `register` in client API** | Added `authApi.register()` to `api/client.ts` |
| 4 | **Login page had no signup link** | Added "Don't have an account? Create one" Link to `LoginPage.tsx` |
| 5 | **Assessments page required raw UUID** | Completely rewrote `AssessmentsPage.tsx` — now loads `GET /api/assessments` and shows a named dropdown with pass score / max attempts info |
| 6 | **No `GET /api/assessments` list endpoint** | Added `GET /api/assessments` route, `list` controller, `listAssessments` service, and `findAllAssessments` repo query (joins assessments + courses) |
| 7 | **Departments unreachable on signup** (requires auth) | Made `GET /api/departments` public so unauthenticated signup form can populate the department dropdown |

---

## Known Limitations / To-Do

- No email verification on signup
- No password reset / forgot password flow
- Enrollment creation on the frontend (enroll button on a course) not yet implemented
- Course creation modal not wired up in CoursesPage (button visible for hr_admin)
- No table pagination (server defaults to full result sets)
