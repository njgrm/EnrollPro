# EnrollPro: Fix for Default Password Verification & Credential Handling (1000018)

Date: 2026-10-24  
From: EnrollPro Developer  
For: ATLAS Lane C (Reference: `enrollpro-1000018-default-password-still-accepted-2026-10-24.md`)

---

## Summary of Changes

We have implemented the requested security and logic fixes in EnrollPro's companion authentication controller (`server/src/features/auth/auth.controller.ts`).

### 1. Strict Stored-Hash Verification First (`POST /api/auth/verify`)
- `verifyCredentials` compares the incoming password candidate against the account's **stored bcrypt hash** (`bcrypt.compare(password, user.password)`) first.
- If the submitted password does not match the account's stored hash, it immediately answers:
  ```json
  HTTP 401 Unauthorized
  {
    "valid": false,
    "message": "Invalid password"
  }
  ```
  This applies even if the submitted password equals the system default password (`DepEd2026!`). The default password is never accepted as a bypass key when the account's stored password has already been changed.

### 2. Password Change Requirement Only for Stored Default Hashes
- A `428 PASSWORD_CHANGE_REQUIRED` response is only returned if:
  1. The submitted password matches the stored hash (`valid === true`), **AND**
  2. The stored hash is actually a configured default password hash (`isPasswordHashOfDefault(user.password)`), or the user is marked with `mustChangePassword` and entered the default password.
- If an account has changed its password away from default (i.e. `!isStoredDefault`), any lingering `mustChangePassword` flag is automatically cleared to `false` in the database, and the user is authenticated normally (`200 OK`, `valid: true`).

### 3. Clear "Must Change" Flag on Password Updates
- When a user replaces their password via the external change-password handoff (`PATCH /api/auth/external/change-password` -> `changeExternalDefaultPassword`), the `mustChangePassword` flag is explicitly set to `false`.
- In addition, `changeExternalDefaultPassword` checks `isPasswordHashOfDefault(user.password)` alongside `mustChangePassword`, ensuring consistent replacement semantics.
- For account `1000018` (and any other account), once the password hash is non-default, subsequent verify calls with the new password return `200 OK` with valid credentials and no 428 prompt.

### 4. Deterministic Account Resolution
- Added `orderBy: { id: "asc" }` to the `prisma.user.findFirst` query matching `{ accountName, employeeId, email }` in `verifyCredentials` to guarantee deterministic user record resolution.

---

## Expected Behavior After Fix

| Endpoint & Request | Expected Response | Description |
|---|---|---|
| `POST /api/auth/verify` with `{ accountName: "1000018", password: <old default DepEd2026!> }` | **401 "Invalid password"** | Rejected because the stored hash is the new password, not default. |
| `POST /api/auth/verify` with `{ accountName: "1000018", password: <new password> }` | **200 OK** (`valid: true`) | Accepted without 428 or change ticket. |
| `POST /api/auth/verify` with `{ accountName: "1000018", password: <random wrong> }` | **401 "Invalid password"** | Rejected immediately. |
| `POST /api/auth/verify` with account still on default password | **428 `PASSWORD_CHANGE_REQUIRED`** | Only occurs if the stored hash in the database is actually the default password. |

---

## Code Diffs in EnrollPro

File: `server/src/features/auth/auth.controller.ts`

```diff
@@ -597,7 +597,8 @@ export async function changeExternalDefaultPassword(
       "PASSWORD_CHANGE_ACCOUNT_UNAVAILABLE",
     );
   }
-  if (!user.mustChangePassword) {
+  const isStoredDefault = await isPasswordHashOfDefault(user.password);
+  if (!user.mustChangePassword && !isStoredDefault) {
     throw new AppError(
       409,
       "The default password has already been replaced. Return to the companion system and sign in again.",
@@ -665,6 +666,7 @@ export async function verifyCredentials(
           { email: accountName },
         ],
       },
+      orderBy: { id: "asc" },
     });
     if (!user) {
       res.status(401).json({ valid: false, message: "User not found" });
@@ -707,10 +709,20 @@ export async function verifyCredentials(
       }
     }
 
+    const isStoredDefault = await isPasswordHashOfDefault(user.password);
     const usesDefaultPassword = await isConfiguredDefaultPassword(password);
-    const requiresPasswordChange = user.mustChangePassword || usesDefaultPassword;
+
+    if (!isStoredDefault && user.mustChangePassword) {
+      await prisma.user.update({
+        where: { id: user.id },
+        data: { mustChangePassword: false },
+      });
+      user.mustChangePassword = false;
+    }
+
+    const requiresPasswordChange = isStoredDefault || (user.mustChangePassword && usesDefaultPassword);
     const { ancillaryRoles, photoPath } = await getTeacherExtraInfo(user.id);
-    const authUser = { ...user, ancillaryRoles };
+    const authUser = { ...user, ancillaryRoles, photoPath };
 
     if (requiresPasswordChange) {
       const returnTo = getSafeCompanionReturnUrl(req, requestedReturnUrl);
```
