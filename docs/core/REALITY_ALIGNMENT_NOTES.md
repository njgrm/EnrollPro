# Reality Alignment Notes (Docs vs Code)

Last updated: 2026-04-14

This note identifies high-impact mismatches between existing docs and current implementation.

## 1. Status vocabulary mismatch

Many existing docs use PRE_REGISTERED_BEC and [SCP]\_QUALIFIED forms.

Current implemented enum (source: server/prisma/schema.prisma and shared/src/constants/index.ts) uses:

- PRE_REGISTERED
- NOT_QUALIFIED
- PASSED
- INTERVIEW_SCHEDULED
- and other pipeline statuses

Action:

- Treat PRE_REGISTERED and NOT_QUALIFIED as current behavior in implementation docs.
- Move PRE_REGISTERED_BEC and [SCP]\_QUALIFIED references into target-state roadmap sections only.

## 2. Role model mismatch

Several docs mention staff roles such as SCP_COORDINATOR, BRIGADA_TEACHER, CLINIC_STAFF, and LIS_COORDINATOR.

Current Prisma Role enum contains only:

- REGISTRAR
- SYSTEM_ADMIN

Routes allow TEACHER in selected read paths, but TEACHER is not represented in Prisma role enum at present.

Action:

- Document current role truth as REGISTRAR and SYSTEM_ADMIN, with runtime TEACHER allowances in selected route guards.
- Add explicit migration plan if full TEACHER enum adoption is desired.

## 3. Algorithm and autonomous workflow claims

Existing docs describe fully automated ranking and sectioning logic (weighted ranking, hard caps, star section distribution) as if implemented.

Current code provides:

- SCP pipeline step definitions and step-level cutoff handling
- capacity checks on assignment actions
- no full autonomous ranking engine
- no autonomous priority sectioning engine

Action:

- Keep these as future roadmap features, not current baseline behavior.

## 4. SIMS overstatement

Existing docs describe Brigada Pagbasa and LIS/SF10 automation as operational.

Current implementation has:

- student list/profile and health records (BoSY/EoSY)
- portal PIN reset
- no explicit Brigada reading-level endpoint/workflow
- no LIS export endpoint
- no automated SF10 request workflow

Action:

- Rewrite SIMS docs into implemented baseline plus backlog section.

## 5. UI state mismatch

Existing UI docs reference status badge sets and navigation semantics that do not match current frontend constants.

Current status rendering baseline should follow:

- client/src/features/enrollment/constants.ts
- client/src/features/enrollment/components/StatusBadge.tsx
- client/src/features/admission/pages/apply/Track.tsx

Action:

- Centralize status UI tokens and update docs accordingly.

## 6. Admin and audit UI mismatch

Backend endpoints exist for:

- /api/audit-logs
- /api/admin/email-logs
- /api/admin/system/health

Frontend currently has placeholders for key pages:

- audit logs page
- admin email logs page
- admin system health page

Action:

- Mark backend as implemented and frontend as pending completion.

## 7. Documentation governance rule

Effective immediately for implementation docs:

- Label each requirement as one of: Implemented, Partially Implemented, Planned.
- Any planned behavior must include target module and acceptance criteria.
- Do not declare target-state workflow as active unless linked to concrete code path.
