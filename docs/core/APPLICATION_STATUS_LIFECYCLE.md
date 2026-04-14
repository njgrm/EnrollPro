# Application Status Lifecycle (Implementation-Aligned)

Last updated: 2026-04-14

## 1. Canonical status set (from code)

Source of truth:

- [server/prisma/schema.prisma](../../server/prisma/schema.prisma)
- [shared/src/constants/index.ts](../../shared/src/constants/index.ts)

Implemented statuses:

1. SUBMITTED
2. UNDER_REVIEW
3. FOR_REVISION
4. ELIGIBLE
5. ASSESSMENT_SCHEDULED
6. ASSESSMENT_TAKEN
7. PASSED
8. INTERVIEW_SCHEDULED
9. PRE_REGISTERED
10. TEMPORARILY_ENROLLED
11. NOT_QUALIFIED
12. ENROLLED
13. REJECTED
14. WITHDRAWN

## 2. Transition baseline (controller-enforced)

Transition policy is implemented in [server/src/features/admission/early-registration.controller.ts](../../server/src/features/admission/early-registration.controller.ts).

Key transitions:

- SUBMITTED -> UNDER_REVIEW, ASSESSMENT_SCHEDULED, REJECTED, WITHDRAWN
- UNDER_REVIEW -> FOR_REVISION, ELIGIBLE, ASSESSMENT_SCHEDULED, PRE_REGISTERED, TEMPORARILY_ENROLLED, REJECTED, WITHDRAWN
- FOR_REVISION -> UNDER_REVIEW, WITHDRAWN
- ELIGIBLE -> ASSESSMENT_SCHEDULED, PRE_REGISTERED, WITHDRAWN
- ASSESSMENT_SCHEDULED -> ASSESSMENT_TAKEN, ASSESSMENT_SCHEDULED, INTERVIEW_SCHEDULED, WITHDRAWN
- ASSESSMENT_TAKEN -> PASSED, NOT_QUALIFIED, ASSESSMENT_SCHEDULED, WITHDRAWN
- PASSED -> PRE_REGISTERED, INTERVIEW_SCHEDULED, ASSESSMENT_SCHEDULED, WITHDRAWN
- INTERVIEW_SCHEDULED -> PRE_REGISTERED, WITHDRAWN
- PRE_REGISTERED -> ENROLLED, TEMPORARILY_ENROLLED, WITHDRAWN
- TEMPORARILY_ENROLLED -> ENROLLED, WITHDRAWN
- NOT_QUALIFIED -> UNDER_REVIEW, WITHDRAWN, REJECTED
- ENROLLED -> WITHDRAWN
- REJECTED -> UNDER_REVIEW, WITHDRAWN

## 3. Phase interpretation

Phase 1 (intake and screening):

- SUBMITTED through PRE_REGISTERED or NOT_QUALIFIED

Phase 2 (finalization):

- PRE_REGISTERED -> ENROLLED
- PRE_REGISTERED -> TEMPORARILY_ENROLLED -> ENROLLED

## 4. Compliance path

When mandatory documentary requirements are incomplete during finalization:

1. Set TEMPORARILY_ENROLLED.
2. Continue school operations while awaiting completion.
3. Upgrade to ENROLLED once requirements are satisfied.

## 5. Legacy wording note

Older documents may use PRE_REGISTERED_BEC and [SCP]\_QUALIFIED language.

Current implemented lifecycle uses PRE_REGISTERED and NOT_QUALIFIED instead.
