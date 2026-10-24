# EnrollPro: 1000018 still treated as "default password, change required" after the password was changed

Date: 2026-10-24. From: ATLAS Lane C. For: the EnrollPro developer (ATLAS never edits EnrollPro).

## What the operator saw
Signing in to ATLAS as 1000018 with the **old default password** sent the browser to EnrollPro's change-password page. The password for 1000018 had already been changed in EnrollPro.

## Why this points at EnrollPro
- ATLAS live uses `ENROLLPRO_API=https://dev-jegs.buru-degree.ts.net/api` (the same EnrollPro the operator changed the password on).
- ATLAS only redirects to the change-password page when EnrollPro's `POST /api/auth/verify` answers **428 / `code: PASSWORD_CHANGE_REQUIRED`** (ATLAS `atlas-server/src/services/local-auth.service.ts`, `tryEnrollProVerify`). ATLAS never decides "default password" on its own, and its own account row for 1000018 has `must_change_password = false`.
- So for 1000018 EnrollPro's verify still **accepted the default password as correct** and asked for a change. After a successful password change it should answer the default password with an invalid-credentials response (not 428).

## Confirmed 2026-10-24 ~11:00 (direct call to EnrollPro, no ATLAS involved)
The operator changed 1000018's password through EnrollPro's change-password page; the NEW password signs in fine. Calling `POST https://dev-jegs.buru-degree.ts.net/api/auth/verify` directly:
- `{accountName: "1000018", password: <old default DepEd2026!>}` -> **428 `PASSWORD_CHANGE_REQUIRED`**, `valid: false`, plus a fresh `passwordChangeUrl` with a change-password **ticket** (JWT, purpose `CHANGE_DEFAULT_PASSWORD`, sub 22, 5-minute expiry).
- `{accountName: "1000018", password: <a random wrong password>}` -> **401 "Invalid password"**.

So EnrollPro decides "this is the default password" by comparing against the default value (or a flag) BEFORE/INSTEAD OF checking the account's real hash. The old default is effectively still a key.

**Security impact (please treat as urgent):** anyone who knows the school-wide default password can get a change-password ticket for ANY account that already changed its password; if the change page accepts that ticket (not tested by ATLAS - we did not use it), they can set a new password -> account takeover. The default must only be honoured while the stored hash IS the default.

## Please fix in EnrollPro
1. In verify (`auth.controller.ts` -> verifyCredentials): compare the submitted password against the account's STORED hash first. Only if it matches AND the account still requires a change, answer 428. If it does not match the stored hash, answer 401 - even when it equals the default.
2. Clear the "must change" flag when the password is changed through the external change-password ticket (check it is cleared for 1000018 now).
3. Expected after the fix: verify(1000018, default) -> invalid credentials; verify(1000018, new password) -> valid, no 428.

No ATLAS change is needed for this item. The SSO landing problem (`/` instead of `/personnel`) is tracked separately on the ATLAS side (card 265), and will get its own handoff only if the wrong hop turns out to be in EnrollPro.
