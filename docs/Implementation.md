# EnrollPro System Implementation Blueprint

**Project:** EnrollPro (Educational Management Information System)  
**Architecture:** PERN (PostgreSQL + Express/Node + React)  
**Policy Baseline:** DepEd DO 03, s. 2018 (Basic Education Enrollment Policy), DO 19, s. 2008 (No Collection), DM 032, s. 2024 (enrollment operational guidance)  
**Scope:** Early Registration (Online + F2F), Enrollment Management, SIMS, Teacher Management, Sectioning & Grade Management, Security/Audit, Email Notifications, Theming

---

## 1. Blueprint Objective

This document defines the implementation architecture and delivery roadmap for a **unified admission-to-enrollment platform** that is policy-aligned, technically scalable, and operationally safe for registrar-led school workflows.

Primary outcomes:

1. Single learner identity pipeline with **global LRN uniqueness** across all channels and school years.
2. Policy-compliant enrollment processing for BEEF and documentary rules.
3. Strong role boundaries for Registrar and Teacher actions with full auditability.
4. Production-ready notification and branding infrastructure for school operations.

---

## 2. Current Baseline (As-Is, from code + docs)

### 2.1 Existing strengths

- Monorepo boundaries are already clean: `client`, `server`, `shared`.
- Hybrid intake already exists:
  - Online public intake: `POST /api/applications`
  - F2F intake (authenticated): `POST /api/applications/f2f`
- Core domain models already implemented: `Applicant`, `Enrollment`, `Section`, `SchoolYear`, `HealthRecord`, `AuditLog`, `EmailLog`, `Teacher`.
- School identity/theming already operational (`/settings/public`, logo upload, accent extraction, CSS variable injection in `RootLayout`).
- Audit trail helper exists and is widely used (`auditLog(...)`).

### 2.2 Gaps to close

- LRN is currently indexed but not enforced as globally unique.
- Status vocabulary in docs and status vocabulary in code are partially divergent.
- Role model inconsistency: routes reference `TEACHER`, but core role enum currently lacks it.
- Email dispatch is log-first with admin resend; no formal asynchronous worker pipeline for full event delivery lifecycle.
- BEEF in UI is represented through sections/components, but policy crosswalk is not explicitly formalized as a compliance matrix artifact.

---

## 3. Target PERN Architecture

## 3.1 Logical module map

| Layer | Module | Responsibility |
| --- | --- | --- |
| PostgreSQL + Prisma | Identity & Enrollment Core | Canonical learner identity, per-SY application/enrollment records, section placement |
| Express API | Admission Module | Intake, dedup, workflow transitions, documentary validation |
| Express API | Enrollment Module | BEEF completion, documentary compliance, finalization rules |
| Express API | SIMS Module | Longitudinal student profile, health/reading records, academic continuity |
| Express API | Teacher/Section Module | Faculty registry, advisory assignment, section capacity controls |
| Express API | Security Module | Auth, RBAC policies, audit event emission |
| Express API | Notification Module | Outbox, provider dispatch, retries, status tracking |
| React + Zustand | Staff UX Layer | Registrar workflows, policy-aware statuses, role-filtered UI routes |
| React + Zustand | Public/Learner UX Layer | Admission submission, tracking, learner portal lookup |

## 3.2 End-to-end interaction flow

```text
Public/F2F Intake -> Admission API -> Identity Resolution (global LRN) -> Applicant Record
               -> Screening/Validation -> Enrollment API -> Sectioning Engine
               -> SIMS Profile Updates -> Notification Outbox -> Email Provider
               -> Audit Trail (every state-changing action)
```

## 3.3 PostgreSQL schema strategy

### Reuse existing core tables

- `applicants`, `applicant_addresses`, `applicant_family_members`, `applicant_previous_schools`
- `applicant_assessments`, `applicant_program_details`, `applicant_documents`, `applicant_checklists`
- `enrollments`, `sections`, `grade_levels`, `school_years`, `school_settings`
- `teachers`, `users`, `health_records`, `audit_logs`, `email_logs`

### Required schema evolutions

1. **Global learner identity boundary**
   - Add `learner_identities`:
     - `id`
     - `lrn` (**UNIQUE, NOT NULL**)
     - `first_seen_at`, `last_seen_at`
     - optional quality markers (`is_lrn_verified`)
   - Add nullable FK on `applicants`: `learner_identity_id`.
   - Keep `applicants` as per-school-year transaction entity.

2. **Role model alignment**
   - Extend role enum to include `TEACHER`.
   - Add optional relation `users.teacher_id` (if teacher can log in as staff user).

3. **Compliance traceability**
   - Add explicit deadline fields for temporary enrollment compliance:
     - `applicants.document_deadline_at` (default Oct 31 of SY)
     - `applicants.compliance_status` (e.g., `PENDING`, `COMPLIED`, `OVERDUE`) if needed for dashboarding.

4. **Notification reliability**
   - Add `email_outbox` (or expand `email_logs` with queue metadata):
     - `idempotency_key`, `retry_count`, `next_attempt_at`, `provider`, `provider_message_id`.

### Index/constraint requirements

- `UNIQUE(learner_identities.lrn)`
- `INDEX(applicants.school_year_id, applicants.status)`
- `INDEX(applicants.learner_identity_id, applicants.school_year_id)`
- `INDEX(audit_logs.subject_type, audit_logs.record_id, audit_logs.created_at)`
- `INDEX(email_outbox.status, email_outbox.next_attempt_at)`

## 3.4 Express/Node API structure

### API layering pattern

```text
router -> controller -> service -> repository/prisma
```

### Module contracts

| Module | Key Endpoints | Notes |
| --- | --- | --- |
| Admission | `/applications`, `/applications/f2f`, `/applications/:id/*` | Intake + screening + transitions |
| Enrollment | `/applications/:id/enroll`, `/applications/:id/temporarily-enroll`, checklist/document APIs | BEEF/documentary compliance gates |
| SIMS | `/students`, `/students/:id`, `/students/:id/health-records` | Longitudinal learner records |
| Sectioning | `/sections`, section assignment helpers | Capacity and grade-level boundaries |
| Teacher | `/teachers` | Profile + assignment support |
| Settings | `/settings/public`, `/settings/logo`, `/settings/accent` | Branding + public phase context |
| Admin | `/admin/users`, `/admin/email-logs`, `/admin/system` | Governance, observability |

### Required service abstractions

- `IdentityResolutionService`
- `AdmissionOrchestratorService`
- `BEEFComplianceService`
- `SectionPlacementService`
- `NotificationDispatcherService`
- `AuditTrailService` (wrapper around `auditLog`)

## 3.5 React state management strategy

Use **domain-segmented store slices**:

- `auth.slice`: token, role, auth lifecycle (already present).
- `settings.slice`: active SY, view override, branding, enrollment phase (already present).
- New recommended slices:
  - `admission.slice` (filters, selected applicant, intake mode state)
  - `enrollment.slice` (checklist draft state, transition guards)
  - `notifications.slice` (delivery summaries, retry statuses)

Rules:

- Keep canonical data on server; stores handle UI/session state only.
- Mutations go through API + optimistic invalidation/refetch.
- Role-based rendering must be route and component gated.

---

## 4. Unified Admission Logic (Global No-Duplicate LRN)

## 4.1 Design rule

**One LRN = one canonical learner identity across all years/channels.**

## 4.2 Admission algorithm (authoritative sequence)

1. Accept payload from Online or F2F channel.
2. Normalize LRN (`digits-only`, length 12).
3. Start DB transaction.
4. Lock identity row path (`SELECT ... FOR UPDATE`) by LRN.
5. Resolve or create `learner_identity`.
6. Check active-SY applicant collision:
   - If existing active applicant for same learner/SY exists, return conflict with existing tracking reference.
7. Create applicant record linked to `learner_identity`.
8. Persist intake channel metadata (`ONLINE` or `F2F`, encodedBy for F2F).
9. Persist checklist/document scaffolding defaults.
10. Emit audit event (`APPLICATION_SUBMITTED` or `F2F_APPLICATION_SUBMITTED`).
11. Write notification event to outbox (`APPLICATION_SUBMITTED`).
12. Commit transaction.
13. Return deterministic tracking number.

## 4.3 Synchronization model (Online + Walk-in)

- Shared applicant schema and shared workflow transitions.
- Channel differences only in metadata and actor identity.
- Duplicate prevention and tracking behavior must be channel-agnostic.

## 4.4 Conflict behavior

- `409 DUPLICATE_LRN_ACTIVE_SY` -> includes existing tracking number.
- Registrar UI offers:
  - open existing record,
  - continue documentary update,
  - avoid second intake creation.

---

## 5. DepEd Compliance Design (BEEF + Documentary Policy)

## 5.1 Form routing matrix

| Enrollment context | Required form |
| --- | --- |
| Incoming G7 / transferee | BEEF |
| Continuing learners (e.g., G8-G10) | Confirmation Slip |
| ALS | Modified ALS Enrollment Form |

## 5.2 Digital BEEF section mapping (system representation)

| BEEF logical block | Server schema mapping |
| --- | --- |
| Learner identity/demographics | `applicants` core fields |
| Learner classification (4Ps/IP/LWD/Balik-Aral) | `applicants` classification fields |
| Current/permanent address | `applicant_addresses` |
| Parent/guardian information | `applicant_family_members` |
| Previous school/academic history | `applicant_previous_schools` |
| Program/track specifics | `applicant_program_details`, strand fields |
| Learning modality preferences | `applicants.learning_modalities` |
| Documentary submissions | `applicant_documents` |
| Documentary verification/checklist | `applicant_checklists` |
| School final action (enrolled/temporary/section) | `applicants.status`, `enrollments` |

## 5.3 Documentary policy enforcement

- Enforce minimum documentary rules from DO 03, s. 2018 at workflow gates.
- Allow temporary enrollment for incomplete PSA/SF9 with explicit deadline handling.
- Deadline monitoring:
  - compute/document Oct 31 cut-off per active SY,
  - dashboard reminders for pending documentary cases.

## 5.4 No Collection compliance

- No payment field, no payment precondition in any enrollment transition.
- Enrollment transitions (`PRE_REGISTERED -> ENROLLED`) must not reference financial state.
- Include no-collection compliance statement in user-facing form/help content.

---

## 6. Security and Audit Architecture

## 6.1 RBAC matrix (Registrar vs Teacher)

| Capability | Registrar | Teacher |
| --- | --- | --- |
| Create/Update applications | Allow | Deny |
| Manage documentary checklist | Allow | Deny |
| Finalize enrollment / temporary enrollment | Allow | Deny |
| View student profiles | Allow | Allow (scoped) |
| Encode health/reading records | Configurable (default allow) | Scoped allow if assigned workflow |
| Manage sections/teachers | Allow (policy-based) | Deny |
| Access admin modules | Deny | Deny |

Implementation notes:

- Enforce both route-level and service-level authorization.
- Add TEACHER role to authoritative role enum and token generation.
- Prefer explicit allow-lists over implicit role inheritance.

## 6.2 Audit trail strategy

Every state-changing action must write:

- `actionType`
- `subjectType`
- `recordId`
- actor (`userId`, role)
- request context (`ipAddress`, `userAgent`)
- timestamp

Critical audited events:

- admission creation (online/f2f),
- checklist/document changes,
- status transitions (approve, reject, temporary, enrolled),
- section assignment changes,
- user/role/admin operations,
- email resend/retry actions.

## 6.3 Security controls

- JWT auth + token expiry handling.
- Password hashing via bcrypt.
- File upload restrictions (MIME + size) at router layer.
- Rate limiting for public and auth endpoints.
- Field-level validation using shared Zod schemas.

---

## 7. Technical Feature Implementation

## 7.1 Automated Email Notifications (Nodemailer/SendGrid)

### Event triggers

- Application submitted
- Assessment scheduled
- Qualification/final decision
- Enrollment finalized with section assignment
- Temporary enrollment reminder before deadline

### Architecture

1. Domain event created in admission/enrollment service.
2. Event persisted in `email_outbox`.
3. Background worker dequeues pending events.
4. Provider adapter sends via configured backend:
   - `NodemailerProvider` (SMTP)
   - `SendGridProvider` (API)
5. Delivery metadata persisted to `email_logs`.
6. Retry with backoff on transient errors; dead-letter after max attempts.

### Non-functional requirements

- Idempotent sending per event (`idempotency_key`).
- Template versioning.
- Admin resend uses same dispatcher path (not ad hoc bypass).

## 7.2 Dynamic School Visual Identity (Theming Engine)

### Existing foundation

- Logo upload endpoint.
- Color palette extraction and accent selection.
- Public settings endpoint returns school identity and active theme.
- Client applies CSS variables at root layout.

### Implementation hardening

- Preserve validated palette + selected accent per school.
- Enforce WCAG contrast threshold for text on accent surfaces.
- Keep a fallback default theme if palette extraction fails.
- Cache `settings/public` on client bootstrap and refresh on identity changes.
- Ensure role-protected branding mutation endpoints (`SYSTEM_ADMIN` only).

---

## 8. Sectioning and Grade Management Strategy

## 8.1 Placement execution order

1. SCP-qualified learners to hard-capped SCP sections.
2. Remaining BEC pool ranked by final general average -> priority sections.
3. Remaining learners round-robin distributed to balance class sizes.

## 8.2 Operational controls

- Capacity lock checks during assignment.
- Manual override path for registrar-driven adjustments with full audit logs.
- Section advisership linked to teacher profiles.

---

## 9. Delivery Roadmap (Execution Phases)

1. **Phase A - Data and role foundation**
   - Add learner identity model + global LRN uniqueness.
   - Add TEACHER role alignment and user-role migration.

2. **Phase B - Unified admission orchestration**
   - Implement identity resolution service and dedupe conflict flow.
   - Normalize online/F2F to one command path.

3. **Phase C - Compliance and enrollment finalization**
   - Formalize BEEF-to-schema validation crosswalk.
   - Implement temporary enrollment deadline policy controls.

4. **Phase D - SIMS, sectioning, and teacher operational scope**
   - Complete teacher-scoped read/write boundaries.
   - Harden section placement service and override trail.

5. **Phase E - Notification and theming reliability**
   - Implement outbox worker + provider abstraction.
   - Complete theme hardening and contrast-safe rendering.

6. **Phase F - Observability, QA, and rollout**
   - Audit completeness checks.
   - Role-based regression tests.
   - Enrollment-window readiness checklist and rollout guide.

---

## 10. Definition of Done

- LRN duplication is impossible across channels and school years.
- BEEF and documentary rules are enforced in code and represented in UI.
- Registrar and Teacher capabilities are explicitly separated and tested.
- All critical mutations are auditable with actor + subject metadata.
- Email delivery has retry-safe asynchronous processing and admin observability.
- Branding engine is stable, contrast-safe, and role-protected.
- Sectioning workflow supports automated + controlled manual operations.

---

## 11. Governance Notes

- Keep policy references explicit in code comments and docs for enrollment-critical validations.
- Treat timezone-sensitive dates using Manila-normalized date handling for all enrollment windows and date-only records.
- Maintain naming consistency with Prisma mapping conventions (`camelCase` in code, `snake_case` in SQL).

