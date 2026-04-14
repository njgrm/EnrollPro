# Security and Audit Trail Baseline

Last updated: 2026-04-14

## 1. Scope

Covers Modules 1-5 and supporting admin/auth flows for:

- role-based access
- audit event coverage
- session and auth behavior
- upload and PII handling baseline

## 2. Current auth and session controls

Sources:

- [server/src/features/auth/auth.controller.ts](../../server/src/features/auth/auth.controller.ts)
- [client/src/shared/api/axiosInstance.ts](../../client/src/shared/api/axiosInstance.ts)
- [client/src/shared/components/ProtectedRoute.tsx](../../client/src/shared/components/ProtectedRoute.tsx)

Implemented controls:

1. JWT auth with expiry.
2. mustChangePassword enforcement at route guard layer.
3. token-expired handling and forced relogin in client interceptor.
4. login rate limiting in auth router.

## 3. Role access matrix (current + recommended baseline)

| Capability                               | REGISTRAR | SYSTEM_ADMIN | TEACHER (runtime in some routes) |
| ---------------------------------------- | --------- | ------------ | -------------------------------- |
| Admission review and transitions         | Allow     | Allow        | Deny                             |
| F2F intake encoding                      | Allow     | Allow        | Deny                             |
| Enrollment finalize and temporary enroll | Allow     | Allow        | Deny                             |
| Student read access                      | Allow     | Allow        | Allow (read-only)                |
| Health record write                      | Allow     | Allow        | Deny                             |
| Teacher CRUD                             | Deny      | Allow        | Deny                             |
| School-year and SCP config write         | Deny      | Allow        | Deny                             |
| Audit log export                         | Deny      | Allow        | Deny                             |

## 4. Audit trail baseline

Primary service/model:

- [server/src/features/audit-logs/audit-logs.service.ts](../../server/src/features/audit-logs/audit-logs.service.ts)
- AuditLog model in [server/prisma/schema.prisma](../../server/prisma/schema.prisma)

Core fields to always capture:

- userId
- actionType
- description
- subjectType
- recordId
- ipAddress
- userAgent
- createdAt

## 5. Mandatory event coverage matrix

| Event category                       | Current status | Notes                                              |
| ------------------------------------ | -------------- | -------------------------------------------------- |
| Auth login                           | Implemented    | USER_LOGIN logged                                  |
| Admin user management                | Implemented    | create/update/deactivate/reactivate/reset logged   |
| Admission submission and transitions | Implemented    | broad coverage in admission controller             |
| Document upload/delete               | Implemented    | logged in document controller                      |
| Health record add/update             | Implemented    | logged in students controller                      |
| Portal PIN reset                     | Implemented    | logged in students controller                      |
| School-year changes                  | Implemented    | status/date/override/delete logged                 |
| Section and curriculum changes       | Implemented    | create/update/delete and SCP config updates logged |
| Audit UI access transparency         | Partial        | backend exists, frontend audit page pending        |

## 6. Security gaps and hardening actions

1. Role enum alignment:
   - if TEACHER is a supported runtime role, add to canonical enum and user validation model.
2. One-time secrets handling:
   - prevent accidental logging of rawPortalPin in client telemetry.
3. Upload controls:
   - keep strict mime/size checks and add malware scanning if environment allows.
4. Sensitive data display:
   - avoid exposing unnecessary personal fields in list endpoints.
5. Audit integrity:
   - ensure all workflow mutation endpoints call shared audit service consistently.

## 7. Data handling policy baseline (practical)

1. Use Manila-normalized date handling for enrollment windows and date-only records.
2. Persist only required PII fields for enrollment operations.
3. Mask high-risk values in logs and exported reports where not operationally required.
4. Keep rate limits on public submission and learner lookup surfaces.

## 8. Verification checklist

1. Confirm protected routes enforce both authenticate and authorize.
2. Confirm mutation endpoints create audit records with actor and request context.
3. Confirm public endpoints are rate limited.
4. Confirm session-expiry flow clears auth and routes to login.
5. Confirm upload restrictions reject unsupported files.
