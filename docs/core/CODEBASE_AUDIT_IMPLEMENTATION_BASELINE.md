# Codebase Audit - Implementation Baseline

Last updated: 2026-04-14

## 1. Architecture summary

EnrollPro is a pnpm monorepo with three main packages:

- client: React 19 + TypeScript + Tailwind CSS v4 + Zustand
- server: Express 5 + TypeScript + Prisma 6
- shared: Zod schemas, constants, and inferred shared types

Backend route mounting is centralized in [server/src/app.ts](../../server/src/app.ts).

Key mounted API groups:

- /api/auth
- /api/settings
- /api/dashboard
- /api/school-years
- /api/curriculum
- /api/sections
- /api/students
- /api/applications
- /api/admin
- /api/audit-logs
- /api/teachers
- /api/learner
- /api/early-registrations

Frontend route topology is in [client/src/router/index.tsx](../../client/src/router/index.tsx), with role-guarding in [client/src/shared/components/ProtectedRoute.tsx](../../client/src/shared/components/ProtectedRoute.tsx).

## 2. Data model baseline

Canonical entities are defined in [server/prisma/schema.prisma](../../server/prisma/schema.prisma).

High-impact models:

- User (roles currently REGISTRAR, SYSTEM_ADMIN in Prisma enum)
- Applicant (main admission-enrollment pipeline record)
- Enrollment (final assignment record)
- SchoolYear and SchoolSetting (active school year pivot)
- GradeLevel and Section
- HealthRecord (BoSY/EoSY health capture)
- ScpProgramConfig, ScpProgramStep, ScpProgramOption
- EarlyRegistrant and EarlyRegistration (DO 017 lane)
- AuditLog and EmailLog

Status enum currently implemented:

- SUBMITTED
- UNDER_REVIEW
- FOR_REVISION
- ELIGIBLE
- ASSESSMENT_SCHEDULED
- ASSESSMENT_TAKEN
- PASSED
- INTERVIEW_SCHEDULED
- PRE_REGISTERED
- TEMPORARILY_ENROLLED
- NOT_QUALIFIED
- ENROLLED
- REJECTED
- WITHDRAWN

## 3. Backend pattern baseline

Common pattern:

router -> authenticate -> authorize -> validate -> controller

Validation contracts are in [shared/src/schemas](../../shared/src/schemas), consumed by middleware validate.

Observed issue:

- Admission orchestration is concentrated in [server/src/features/admission/early-registration.controller.ts](../../server/src/features/admission/early-registration.controller.ts), creating a large mixed-responsibility controller.

## 4. Frontend pattern baseline

Common pattern:

- Page-level data loading with useEffect + direct axios calls from [client/src/shared/api/axiosInstance.ts](../../client/src/shared/api/axiosInstance.ts)
- Auth/session in [client/src/store/auth.slice.ts](../../client/src/store/auth.slice.ts)
- School-year and phase state in [client/src/store/settings.slice.ts](../../client/src/store/settings.slice.ts)

Current constraints:

- No query caching layer (no TanStack Query/SWR)
- Multiple list pages duplicate pagination/filter/loading patterns
- Some admin and audit pages are placeholders while backend endpoints exist

## 5. Inconsistencies and technical debt

### A. Admission flow duplication

Implementation currently has two parallel early-registration surfaces:

- /api/applications with legacy apply/F2F UI flow
- /api/early-registrations with DO 017 flow

Frontend duplicates multi-step form behavior in:

- [client/src/features/admission/pages/online-enrollment/EarlyRegistrationForm.tsx](../../client/src/features/admission/pages/online-enrollment/EarlyRegistrationForm.tsx)
- [client/src/features/admission/pages/f2f/Index.tsx](../../client/src/features/admission/pages/f2f/Index.tsx)
- [client/src/features/early-registration/pages/apply/EarlyRegistrationForm.tsx](../../client/src/features/early-registration/pages/apply/EarlyRegistrationForm.tsx)

### B. Role model mismatch across layers

- Prisma Role enum includes REGISTRAR and SYSTEM_ADMIN.
- Several routes authorize TEACHER as a string, which works at runtime but is not represented in the Prisma role enum.

### C. Placeholder UIs for available APIs

- Audit logs UI placeholder: [client/src/features/audit-logs/pages/Index.tsx](../../client/src/features/audit-logs/pages/Index.tsx)
- Email logs UI placeholder: [client/src/features/admin/pages/EmailLogs.tsx](../../client/src/features/admin/pages/EmailLogs.tsx)
- System health UI placeholder: [client/src/features/admin/pages/SystemHealth.tsx](../../client/src/features/admin/pages/SystemHealth.tsx)

### D. Docs drift from implementation

Multiple docs claim statuses/roles/algorithms that are not yet implemented as code reality. See [core/REALITY_ALIGNMENT_NOTES.md](REALITY_ALIGNMENT_NOTES.md).

## 6. Missing abstractions

Recommended extraction targets:

1. AdmissionOrchestratorService from monolithic admission controller.
2. Shared list filtering and pagination hooks for client pages.
3. Shared status config and badge rendering map across admission/enrollment/students.
4. useActiveSchoolYear helper hook to avoid repeating viewingSchoolYearId fallback logic.
5. API contract docs generated from shared schemas and router inventory.

## 7. Immediate refactor priority

P1

- Normalize documentation to current code behavior.
- Consolidate admission form logic into reusable feature primitives.
- Implement audit logs page using existing /api/audit-logs endpoints.

P2

- Split admission controller by concern (submission, workflow transitions, assessments, checklist/documents).
- Introduce query caching for list and details pages.

P3

- Standardize admin pages to consume existing backend features (email logs/system health).
- Add role enum alignment plan for TEACHER and future staff roles.
