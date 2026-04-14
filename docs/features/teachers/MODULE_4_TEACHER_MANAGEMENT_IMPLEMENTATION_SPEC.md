# Module 4 Implementation Spec: Teacher Management and Account Provisioning

Last updated: 2026-04-14

## 1. Module intent

Manage teacher profiles used for advising and support administrative user provisioning workflows for staff accounts.

## 2. Current implemented backend surface

Teacher module routes:

- [server/src/features/teachers/teachers.router.ts](../../../server/src/features/teachers/teachers.router.ts)
- [server/src/features/teachers/teachers.controller.ts](../../../server/src/features/teachers/teachers.controller.ts)

Admin user provisioning routes:

- [server/src/features/admin/admin.router.ts](../../../server/src/features/admin/admin.router.ts)
- [server/src/features/admin/admin-user.controller.ts](../../../server/src/features/admin/admin-user.controller.ts)

Frontend:

- [client/src/features/teachers/pages/Index.tsx](../../../client/src/features/teachers/pages/Index.tsx)
- [client/src/features/admin/pages/Users.tsx](../../../client/src/features/admin/pages/Users.tsx)

## 3. User stories

### 3.1 Teacher profile stories

1. As a system admin, I can create and maintain teacher profile records.
2. As a system admin, I can deactivate/reactivate teacher records.
3. As registrar/admin, I can use active teacher list for section adviser assignment.

### 3.2 Account provisioning stories

1. As a system admin, I can create staff user accounts with role assignment.
2. As a system admin, I can reset staff passwords and force password change on next login.
3. As a system admin, I can deactivate/reactivate user accounts.

## 4. Acceptance criteria (current implementation)

1. Teacher CRUD is SYSTEM_ADMIN-only.
2. Teacher activation status is reflected in section adviser picker lists.
3. Admin user create/update/reset/deactivate/reactivate endpoints are SYSTEM_ADMIN-only.
4. User and teacher mutations are audit-logged.
5. Password reset and must-change-password patterns are enforced in auth flow.

## 5. Edge cases

1. Duplicate email or employee ID conflicts must return clear validation conflicts.
2. Deactivation should not silently break section references; advisory assignments must remain readable.
3. Role downgrade or deactivation should not lock out all administrators.
4. Reset password flow should avoid exposing plaintext beyond immediate secure dialog scope.

## 6. API contract baseline (REST)

Teacher profiles:

- GET /api/teachers
- GET /api/teachers/:id
- POST /api/teachers
- PUT /api/teachers/:id
- PATCH /api/teachers/:id/deactivate
- PATCH /api/teachers/:id/reactivate

Admin user provisioning:

- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/:id
- PATCH /api/admin/users/:id/deactivate
- PATCH /api/admin/users/:id/reactivate
- PATCH /api/admin/users/:id/reset-password

## 7. Best UX/UI approach for Module 4

Design direction: operational admin console with error-proof account actions.

1. Two-pane policy:
   - Teacher directory for profile operations.
   - User account table for credentials and role governance.
2. Defensive action UX:
   - explicit confirmation on deactivate/reactivate/reset-password.
3. Validation-first forms:
   - strict email/mobile/password guidance inline,
   - conflict errors pinned near fields.
4. Access clarity:
   - display current operator role and restricted action hints.
5. Registrar-heavy context:
   - include adviser assignment impact note when deactivating teacher profiles.

## 8. Refactor targets for Module 4

1. Normalize teacher and user profile field models where overlap exists (employeeId/contact).
2. Add server-side guard to prevent removing last active SYSTEM_ADMIN account.
3. Add account action result telemetry for admin governance.
4. Connect teacher subject/specialization more directly to section and curriculum workflows.
