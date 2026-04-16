# Module 2 Implementation Spec: Enrollment Management

Last updated: 2026-04-14

## 1. Module intent

Finalize eligible/pre-registered learners into official enrollment, manage temporary enrollment for missing documents, and maintain section assignment integrity.

## 2. Current implemented backend surface

Enrollment operations are currently exposed through admission workflow controller actions.

Route source:

- [server/src/features/admission/admission.router.ts](../../../server/src/features/admission/admission.router.ts)

Controller source:

- [server/src/features/admission/early-registration.controller.ts](../../../server/src/features/admission/early-registration.controller.ts)

Requirement logic source:

- [server/src/features/enrollment/enrollment-requirement.service.ts](../../../server/src/features/enrollment/enrollment-requirement.service.ts)

Frontend source:

- [client/src/features/enrollment/pages/Index.tsx](../../../client/src/features/enrollment/pages/Index.tsx)
- [client/src/features/enrollment/components](../../../client/src/features/enrollment/components)

## 3. User stories

### 3.1 Registrar stories

1. As a registrar, I can review learner application details and current status timeline.
2. As a registrar, I can mark learners as temporarily enrolled when mandatory documents are incomplete.
3. As a registrar, I can finalize learners to ENROLLED only when mandatory requirements are satisfied.
4. As a registrar, I can record assessment outcomes and interview decisions for SCP-linked applicants.

### 3.2 Admin stories

1. As a system admin, I can perform all registrar actions and override restricted operations where allowed.

### 3.3 Online/F2F context

1. As a parent/guardian, I can monitor intake status, but official enrollment finalization remains staff-only.
2. As walk-in staff, I can continue enrollment actions for F2F encoded learners in the same workflow.

## 4. Acceptance criteria (current implementation)

1. Enroll action only allows transition to ENROLLED from PRE_REGISTERED or TEMPORARILY_ENROLLED.
2. Temporarily-enroll action sets both status and isTemporarilyEnrolled flag.
3. Mandatory checklist requirements are validated before official ENROLLED transition.
4. Section capacity checks are enforced during approval/offer-regular paths.
5. Enrollment finalization can return one-time learner portal PIN in response.
6. Mutations write audit logs.
7. Recording an SCP assessment score does not auto-transition to PASSED or NOT_QUALIFIED; registrar decision remains explicit.
8. SCP assessment scores can be corrected while applicant status is ASSESSMENT_SCHEDULED or ASSESSMENT_TAKEN.

## 5. Edge cases

1. Checklist missing or incomplete should block official enrollment with clear reason.
2. Full section should fail assignment with capacity error.
3. Invalid status transitions should return 422 style errors.
4. Repeated enroll/finalize actions should not create duplicate enrollment records.
5. Temporary enrollment should support later conversion to ENROLLED without losing history.

## 6. API contract baseline (REST)

Current high-use enrollment actions:

- PATCH /api/applications/:id/approve
- PATCH /api/applications/:id/enroll
- PATCH /api/applications/:id/temporarily-enroll
- PATCH /api/applications/:id/checklist
- GET /api/applications/:id/requirements
- GET /api/applications/:id/sections
- PATCH /api/applications/:id/schedule-assessment
- PATCH /api/applications/:id/record-step-result
- PATCH /api/applications/:id/pass
- PATCH /api/applications/:id/fail
- PATCH /api/applications/:id/offer-regular

## 7. Best UX/UI approach for Module 2

Design direction: registrar command center with low-friction detail actions.

1. Master-detail layout with persistent filter memory:
   - left list for queue,
   - right detail panel for timeline, requirements, and actions.
2. Role-aware action panels:
   - only show actions valid for current status.
3. Temporary enrollment support UX:
   - explicit warning/education copy,
   - clear indicator that learner is active but compliance-pending.
4. Checklist UX:
   - grouped by policy-critical requirements,
   - completion meter and blocker reason summary.
5. Accessibility and low-infra fit:
   - keyboard operable panel resizing alternatives,
   - reduced motion fallback,
   - clear offline/retry behavior for high-latency environments.

## 8. Refactor targets for Module 2

1. Extract dedicated enrollment.controller and enrollment.router from admission controller.
2. Move requirement validation and finalization logic into EnrollmentService.
3. Standardize enrollment response payloads and error codes.
4. Replace alert-based portal PIN display with secure, copy-safe confirmation dialog and audited acknowledgment action.

## 9. Registrar journey map (implementation-aligned)

### 9.1 SCP assessment to decision path

1. Registrar verifies applicant and schedules the next required SCP step.
2. Applicant enters ASSESSMENT_SCHEDULED while required steps are in progress.
3. Registrar records score via record-step-result.
4. If required non-interview steps are complete, status moves to ASSESSMENT_TAKEN.
5. Registrar may edit and re-save completed step scores while status is ASSESSMENT_SCHEDULED or ASSESSMENT_TAKEN.
6. Registrar performs manual override decision:
   PASSED path: trigger pass action and continue to interview/pre-registration path as configured.
   NOT_QUALIFIED path: trigger fail action and move to fallback queue.

### 9.2 SCP non-qualifier fallback to general enrollment

1. Applicant is in NOT_QUALIFIED with non-REGULAR applicantType.
2. Registrar reviews capacity and section availability.
3. Registrar triggers offer-regular.
4. System converts applicantType to REGULAR and sets status to PRE_REGISTERED.
5. Applicant proceeds through standard general enrollment flow:
   PRE_REGISTERED -> TEMPORARILY_ENROLLED (if documentary gap) or ENROLLED.

## 10. Backend data tags for filtering (no schema change)

Use derived tags in queries and UI grouping. These are computed from existing fields only.

### 10.1 Core fields

- applicantType
- status
- earlyRegistrationId (on enrollment_applications, optional but useful to trace fallback origin)

### 10.2 Derived filter tags

1. SCP_PIPELINE_ACTIVE
   Definition: applicantType != REGULAR and status in (SUBMITTED, VERIFIED, UNDER_REVIEW, ELIGIBLE, ASSESSMENT_SCHEDULED, ASSESSMENT_TAKEN, PASSED, INTERVIEW_SCHEDULED, NOT_QUALIFIED)
   Use: show candidates still in SCP screening or decision queues.

2. SCP_READY_FOR_FALLBACK
   Definition: applicantType != REGULAR and status = NOT_QUALIFIED
   Use: registrar queue for Offer Regular decisions.

3. GENERAL_ENROLLMENT_POOL
   Definition: applicantType = REGULAR and status in (PRE_REGISTERED, TEMPORARILY_ENROLLED, ENROLLED)
   Use: standard enrollment board, including converted SCP non-qualifiers.

4. FALLBACK_CONVERTED_TO_REGULAR
   Definition: applicantType = REGULAR and earlyRegistrationId is not null and status in (PRE_REGISTERED, TEMPORARILY_ENROLLED, ENROLLED)
   Use: reporting slice for students moved from SCP track into regular enrollment.

### 10.3 Query patterns

- Exclude fallback-converted learners from SCP operational boards:
  applicantType != REGULAR

- Keep fallback-converted learners visible in general enrollment:
  applicantType = REGULAR and status in (PRE_REGISTERED, TEMPORARILY_ENROLLED, ENROLLED)

- Isolate registrar action queue for fallback conversion:
  applicantType != REGULAR and status = NOT_QUALIFIED
