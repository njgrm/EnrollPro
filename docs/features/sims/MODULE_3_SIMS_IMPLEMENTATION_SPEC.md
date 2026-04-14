# Module 3 Implementation Spec: Student Information Management System (SIMS)

Last updated: 2026-04-14

## 1. Module intent

Provide staff with searchable student records, profile history, health records, and learner portal credential lifecycle support.

## 2. Current implemented backend surface

Routes:

- [server/src/features/students/students.router.ts](../../../server/src/features/students/students.router.ts)
- [server/src/features/learner/learner.router.ts](../../../server/src/features/learner/learner.router.ts)

Controllers/services:

- [server/src/features/students/students.controller.ts](../../../server/src/features/students/students.controller.ts)
- [server/src/features/students/students.service.ts](../../../server/src/features/students/students.service.ts)
- [server/src/features/learner/learner.controller.ts](../../../server/src/features/learner/learner.controller.ts)
- [server/src/features/learner/portal-pin.service.ts](../../../server/src/features/learner/portal-pin.service.ts)

Frontend:

- [client/src/features/students/pages/Index.tsx](../../../client/src/features/students/pages/Index.tsx)
- [client/src/features/students/pages/Profile.tsx](../../../client/src/features/students/pages/Profile.tsx)
- [client/src/features/learner/pages/LearnerPortal.tsx](../../../client/src/features/learner/pages/LearnerPortal.tsx)

## 3. User stories

### 3.1 Staff stories

1. As a registrar, I can search enrolled learners by LRN or name with school-year scope.
2. As staff, I can open a detailed learner profile containing demographic, family, academic, and enrollment context.
3. As registrar/admin, I can add and update health records by assessment period.
4. As registrar/admin, I can reset learner portal PIN for account recovery.

### 3.2 Teacher stories

1. As a teacher, I can view students and health records where read access is allowed by route guards.

### 3.3 Learner-facing stories

1. As a learner family, I can use the learner lookup flow with LRN + birthdate + PIN to access portal details.

## 4. Acceptance criteria (current implementation)

1. Students list supports school year, section, grade level, status, and search filters.
2. Student details return enrollment and section context.
3. Health record uniqueness per applicant + school year + assessment period is enforced.
4. Health mutations are audit-logged.
5. Portal PIN reset writes audit trail and returns one-time new PIN.
6. Learner lookup endpoint is rate-limited.

## 5. Edge cases

1. Duplicate BoSY/EoSY health entries must return conflict-style validation.
2. Invalid applicant or record IDs must return 4xx not found or validation errors.
3. PIN reset should be restricted to authorized roles.
4. Learner lookup brute-force attempts should be rate-limited and non-enumerative.
5. Missing school year context in staff list should fail safely.

## 6. API contract baseline (REST)

- GET /api/students
- GET /api/students/:id
- PUT /api/students/:id
- GET /api/students/:id/health-records
- POST /api/students/:id/health-records
- PUT /api/students/:id/health-records/:recId
- POST /api/students/:id/reset-portal-pin
- POST /api/learner/lookup

## 7. Best UX/UI approach for Module 3

Design direction: profile-centric records workstation for registrar and support staff.

1. Search-first landing page:
   - fast filter controls,
   - clear school-year context badge,
   - sticky filter row for long list sessions.
2. Profile tabs with stable information hierarchy:
   - personal, academic, classifications, timeline, health.
3. Health record UX:
   - period-based cards (BoSY and EoSY),
   - duplicate prevention message at form submit,
   - audit attribution shown in details.
4. Credential actions:
   - PIN reset via confirmation modal with one-time copy action and warning text.
5. Low infrastructure fit:
   - compact table mode option,
   - minimal image dependency,
   - graceful loading and retry hints.

## 8. Refactor targets for Module 3

1. Extract profile DTO mappers out of students.controller to dedicated presenter helpers.
2. Add Brigada reading-level workflow as first-class endpoint and UI tab.
3. Add export service for registrar reporting and LIS-prep views.
4. Introduce role-capability matrix docs and tests for TEACHER read scope.
