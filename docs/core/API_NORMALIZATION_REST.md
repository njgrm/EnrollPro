# API Normalization Spec (REST-First)

Last updated: 2026-04-14

## 1. Why REST is the chosen pattern

Current implementation is already REST-centric across modules with route-grouped resources and action endpoints.

Keeping REST avoids breaking existing client integrations and allows phased normalization.

## 2. Normalization targets

1. Consistent route naming per resource and action.
2. Consistent response envelope shape.
3. Consistent domain error taxonomy.
4. One source of validation contracts from shared Zod schemas.
5. Explicit compatibility policy for legacy endpoints.

## 3. Response envelope standard

Success:

```json
{
  "data": {},
  "meta": {
    "requestId": "optional",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

## 4. Error taxonomy baseline

| HTTP | Code           | Use case                                           |
| ---- | -------------- | -------------------------------------------------- |
| 400  | BAD_REQUEST    | malformed payload/query                            |
| 401  | UNAUTHORIZED   | missing/invalid auth                               |
| 403  | FORBIDDEN      | role lacks capability                              |
| 404  | NOT_FOUND      | record not found                                   |
| 409  | CONFLICT       | duplicate LRN/email/unique key conflict            |
| 422  | INVALID_STATE  | invalid workflow transition or unmet business rule |
| 429  | RATE_LIMITED   | submission or lookup throttled                     |
| 500  | INTERNAL_ERROR | unhandled server error                             |

## 5. Endpoint normalization map (Modules 1-5)

## 5.1 Early registration and admission

Current:

- /api/applications/\*
- /api/early-registrations/\*

Normalization policy:

1. Keep both namespaces during transition.
2. Introduce consistent status and transition docs per endpoint.
3. Add compatibility notes in each endpoint spec.

## 5.2 Enrollment actions

Current enrollment actions are in applications namespace.

Normalization target:

- Keep current paths now.
- Introduce enrollment-focused docs grouping and optional future /api/enrollments namespace without forced migration yet.

## 5.3 SIMS

Current endpoints are mostly resource-consistent under /api/students and /api/learner.

Normalization tasks:

- Standardize list/detail envelopes and audit metadata exposure.

## 5.4 Teachers and sections

Current endpoints are resource-centric and stable.

Normalization tasks:

- Align conflict/validation errors and list pagination shapes.

## 6. Contract ownership model

Validation source:

- shared/src/schemas/\*.schema.ts

Router binding:

- validate(schema) middleware in feature routers

Controller rule:

- do not duplicate shape validation logic in controller when already covered by Zod.

## 7. Request/response examples

## 7.1 Early registration submit (DO 017)

Request:

```json
{
  "schoolYear": "2026-2027",
  "gradeLevel": "7",
  "learnerType": "NEW_ENROLLEE",
  "lastName": "DELA CRUZ",
  "firstName": "JUAN",
  "birthdate": "2013-07-15",
  "sex": "MALE",
  "barangay": "POBLACION",
  "cityMunicipality": "CITY",
  "province": "PROVINCE",
  "contactNumber": "0912-345-6789",
  "isPrivacyConsentGiven": true
}
```

Response (normalized target):

```json
{
  "data": {
    "id": 101,
    "registrantId": 88,
    "learnerName": "DELA CRUZ, JUAN"
  }
}
```

## 7.2 Enroll finalize

Request:

```json
{}
```

Response (current behavior includes one-time pin):

```json
{
  "data": {
    "id": 2001,
    "status": "ENROLLED",
    "rawPortalPin": "123456"
  }
}
```

Security note: rawPortalPin should be displayed once in secure staff UI and never logged client-side.

## 8. Backward compatibility policy

1. Maintain legacy fields while introducing normalized envelope in staged releases.
2. Version with additive changes first.
3. Remove legacy response shape only after client migration and release window sign-off.

## 9. OpenAPI readiness

Current codebase has no OpenAPI generation.

Recommended path:

1. Add endpoint contract markdown specs under docs/features first.
2. Introduce lightweight OpenAPI generation from shared Zod schemas in a later phase.
3. Keep contract tests to prevent drift.
