# JWT Authentication and Authorization (Implementation-Aligned)

Last updated: 2026-04-14

## 1. Security intent

All protected staff actions require JWT authentication and role authorization.

Primary auth implementation:

- [server/src/features/auth/auth.controller.ts](../../server/src/features/auth/auth.controller.ts)
- [server/src/features/auth/auth.router.ts](../../server/src/features/auth/auth.router.ts)
- [server/src/middleware/authenticate.ts](../../server/src/middleware/authenticate.ts)
- [server/src/middleware/authorize.ts](../../server/src/middleware/authorize.ts)

## 2. Current role model

Canonical role enum in Prisma currently includes:

- REGISTRAR
- SYSTEM_ADMIN

Runtime note:

- Some route guards also allow TEACHER for read-only access patterns.

## 3. JWT payload (current)

Current token payload includes:

- userId
- role
- mustChangePassword

## 4. Session controls

1. Login issues JWT with configured expiration.
2. Inactive users are denied login.
3. Password change flow enforces new password and clears mustChangePassword.
4. Client interceptor handles expired token and redirects to login.

Client references:

- [client/src/shared/api/axiosInstance.ts](../../client/src/shared/api/axiosInstance.ts)
- [client/src/shared/components/ProtectedRoute.tsx](../../client/src/shared/components/ProtectedRoute.tsx)

## 5. Route protection pattern

Standard pattern:

authenticate -> authorize(role list) -> controller

Examples:

- Admin-only endpoints under /api/admin
- Registrar/admin workflow endpoints under /api/applications
- Teacher read access on selected dashboard, school-year, and students endpoints

## 6. Hardening next steps

1. Align TEACHER runtime behavior with canonical enum and user lifecycle management.
2. Introduce endpoint-level role matrix tests to prevent accidental privilege drift.
3. Maintain strict audit logging on all mutation endpoints.
