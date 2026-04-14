# Architecture Refactor Blueprint (Code-Grounded)

Last updated: 2026-04-14

## 1. Refactor objective

Improve maintainability and reduce coupling while preserving current behavior.

Primary pain points:

- monolithic admission controller
- duplicated form flow logic
- repeated list/pagination state management in frontend pages

## 2. Backend target structure

Current feature structure is good but service boundaries are uneven.

Recommended module shape:

```text
server/src/features/<feature>/
  <feature>.router.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.repository.ts (optional)
  <feature>.mapper.ts (optional)
```

High-priority extraction from admission:

1. admission-submission.service.ts
2. admission-transition.service.ts
3. admission-assessment.service.ts
4. admission-checklist.service.ts

## 3. Frontend target structure

Current routes/features are clear, but shared state and component reuse can improve.

Recommended additions:

```text
client/src/features/shared/
  hooks/
    useActiveSchoolYear.ts
    usePaginatedList.ts
  status/
    statusConfig.ts
    statusLabel.ts
  forms/
    admission/
      useAdmissionDraft.ts
      admissionStepperConfig.ts
```

Refactor focus:

1. unify duplicated admission/f2f/early-reg form mechanics,
2. centralize status label and badge presentation,
3. standardize list filtering/pagination hooks.

## 4. Separation of concerns rules

Controller rules:

- parse input and invoke service
- avoid embedded workflow rule trees in controller where possible

Service rules:

- own business transitions and invariants
- return typed result objects

UI rules:

- page components orchestrate data
- reusable components are stateless where practical
- hooks manage async and stateful concerns

## 5. Refactor phases

Phase A (safe extraction)

1. move admission helper functions into service files without changing endpoint behavior.
2. add unit tests for extracted transition logic.

Phase B (frontend consolidation)

1. extract shared form draft and stepper logic.
2. replace duplicated status maps with shared constants.

Phase C (feature completion)

1. implement audit logs page with existing backend endpoint.
2. implement admin email/system pages using existing APIs.

## 6. Verification gates

1. no route contract breakage for existing endpoints.
2. no status-transition behavior drift.
3. no regression in school-year scoping.
4. lint/build pass and targeted test pass.
