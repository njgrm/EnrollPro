# Module 1 Implementation Spec: Early Registration (Grade 7-10)

Last updated: 2026-04-14

## 1. Module intent

Support two currently implemented intake lanes:

- Lane A: Admission applications under /api/applications (legacy lane, deeply tied to full admission workflow).
- Lane B: DO 017 early registration under /api/early-registrations (focused early registration lane for Grades 7-10).

Both lanes support ONLINE and F2F data entry.

## 2. Current implemented backend surface

Primary route files:

- [server/src/features/admission/admission.router.ts](../../../server/src/features/admission/admission.router.ts)
- [server/src/features/early-registration/early-reg.router.ts](../../../server/src/features/early-registration/early-reg.router.ts)

Primary controller files:

- [server/src/features/admission/early-registration.controller.ts](../../../server/src/features/admission/early-registration.controller.ts)
- [server/src/features/early-registration/early-reg.controller.ts](../../../server/src/features/early-registration/early-reg.controller.ts)

Validation contracts:

- [shared/src/schemas/application.schema.ts](../../../shared/src/schemas/application.schema.ts)
- [shared/src/schemas/early-registration.schema.ts](../../../shared/src/schemas/early-registration.schema.ts)

## 3. User stories

### 3.1 Online flow stories

1. As a parent/guardian, I can submit a public application and receive a tracking number.
2. As a parent/guardian, I can submit DO 017 early registration for Grade 7-10 and get confirmation.
3. As a learner family, I can track application status via tracking number.

### 3.2 F2F walk-in stories

1. As a registrar, I can encode walk-in applications with channel marked as F2F.
2. As a registrar, I can encode DO 017 early registrations for learners without internet access.
3. As a registrar, I can review and verify early registrations.

## 4. Acceptance criteria (current implementation)

1. Public submissions are rate-limited at route level.
2. F2F submissions require authenticated REGISTRAR or SYSTEM_ADMIN role.
3. Duplicate guard exists for early-registration LRN within school-year context.
4. Data normalization to uppercase is applied while preserving email/contact-sensitive fields.
5. Status transition checks enforce allowed transitions in admission workflow.
6. Successful submission returns either tracking number (applications lane) or registration confirmation payload (DO 017 lane).

## 5. Edge cases

1. Missing active school year should return a clear 4xx error.
2. Invalid or missing birthdate should fail validation.
3. Duplicate LRN in same school year should return conflict response.
4. Parent/guardian relationship gaps should be blocked by schema superRefine rules.
5. Intake when enrollment gate is closed should be rejected in admissions lane.
6. Inconsistent grade constraints between lanes (Grade 7 only vs Grade 7-10) must be explicitly handled in docs and UI copy.

## 6. Online vs F2F behavior split

## 6.1 Online

- Public endpoint, stricter rate limit, no staff identity attached.
- UX should prioritize clarity, draft recovery, and status tracking confidence.

## 6.2 F2F

- Authenticated endpoint with encodedBy attribution.
- UX should prioritize fast data capture, keyboard-first input, and queue processing.

## 7. API contract baseline (REST)

### 7.1 Legacy applications lane

- POST /api/applications
- POST /api/applications/f2f
- GET /api/applications/track/:trackingNumber

### 7.2 DO 017 lane

- POST /api/early-registrations
- POST /api/early-registrations/f2f
- GET /api/early-registrations
- GET /api/early-registrations/:id
- PATCH /api/early-registrations/:id/verify

## 8. Best UX/UI approach for Module 1

Design direction: dual-lane but unified interaction language.

1. Intake mode banner:
   - Online: public self-service guidance, privacy and tracking guidance.
   - F2F: staff-mode banner, queue index, and encoded-by indicator.
2. Stepper forms with save-draft and recovery:
   - keep lightweight sections and immediate field-level validation.
3. Network-resilient behavior:
   - autosave local draft every 1 second,
   - explicit retry CTA on failure,
   - clear conflict resolution messages for duplicate records.
4. Registrar efficiency:
   - keyboard navigation, tab order stability, and one-click reset for next walk-in.
5. Status communication:
   - use canonical current statuses (PRE_REGISTERED, NOT_QUALIFIED, etc.) from code constants.

## 9. Refactor targets for Module 1

1. Consolidate duplicated form logic across admission/apply, admission/f2f, and early-registration/apply.
2. Introduce shared intake orchestration service for both API lanes.
3. Harmonize field naming and validation behavior between application.schema and early-registration.schema where domain overlap exists.
4. Create one status presentation map reused by monitor, pipelines, enrollment, and tracking pages.
