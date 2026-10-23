# EnrollPro handoff: ATLAS access toggles per grade level

For: the EnrollPro developer. From: ATLAS Lane C, 2026-10-21. ATLAS makes no change in EnrollPro; this note says exactly what we
need. Line references are from the EnrollPro mirror at `1a4926b7` (2026-10-12).

## Why

In the beneficiary schools each scheduler is assigned grade levels, and several schedulers work at the same time. The same goes for
teaching load. Operator decision (2026-10-21): access must be "as dynamic as possible". For each person, the admin chooses which
grade levels they may **assign teaching load** for, and which grade levels they may **build schedules** for. These are two
separate lists. Everyone can still view every grade in ATLAS; only editing is limited.

## What EnrollPro sends today

`companionAccess.atlas` (faculty feed `server/src/features/integration/integration.controller.ts` ~715, and the SSO identity
`server/src/features/auth/companion-sso.service.ts` ~540):

```json
{ "schoolYearId": 5, "assignTeachingLoad": true, "buildSchedules": false, "gradeLevelIds": [7] }
```

`gradeLevelIds` is derived from `GRADE N COORDINATOR` ancillary roles, applies to both toggles, and `null` means all grades. ATLAS
starts enforcing this list now (ATLAS card 214), so nothing breaks while you build the change below.

## What we need

1. **Admin UI (teacher panel, "ATLAS access toggles"):**
   - Under each toggle, add grade checkboxes for the school year's grade levels plus an **All grades** choice.
   - Saving with a toggle on and no grade chosen is not allowed.
   - Stored per school year, like the toggles today.
2. **Payload.** Keep the existing fields (ATLAS still reads them) and add two lists:
   ```json
   {
     "schoolYearId": 5,
     "assignTeachingLoad": true,
     "buildSchedules": true,
     "gradeLevelIds": [7],
     "assignTeachingLoadGradeLevelIds": "ALL",
     "buildSchedulesGradeLevelIds": [7, 8]
   }
   ```
   - Each new field is either the string `"ALL"` or a non-empty array of EnrollPro grade-level ids. Never `[]` or `null` for "all"; we
     treat those as a broken payload.
   - When a toggle is off, its list may be omitted.
3. **Send it in both places:** the faculty feed (`/api/integration/v1/faculty`) and the SSO exchange identity.
   `/api/auth/verify` does not need it.
4. **Also please fix the save path first** (separate handoff `enrollpro-teacher-atlas-toggles-save-2026-10-21.md`). Otherwise
   admins cannot set any of this from the panel.

## Done when

On `dev-jegs`:
- an admin gives teacher 1000015 **Build schedules: Grade 7, Grade 8** and **Assign teaching load: off**, then saves;
- the faculty feed row for 1000015 shows `buildSchedules: true`, `buildSchedulesGradeLevelIds: [<G7 id>, <G8 id>]`.

Tell us when it is deployed; ATLAS reads the new lists automatically (forward-compatible since card 214).
