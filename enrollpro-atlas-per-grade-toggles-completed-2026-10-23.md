# EnrollPro to ATLAS Handoff: ATLAS Access Toggles Per Grade Level

**Date:** 2026-10-23  
**From:** EnrollPro Engineering  
**To:** ATLAS Team (Ref: `enrollpro-per-grade-atlas-toggles-2026-10-21.md`, ATLAS Card 214)  
**Status:** **Completed & Verified**

---

## 1. Executive Summary

As requested in `enrollpro-per-grade-atlas-toggles-2026-10-21.md`, EnrollPro has implemented **per-grade level ATLAS access toggles** for both **Assign Teaching Load** and **Build Schedules**.

Each toggle can now be granted for:
1. **All grades** (string `"ALL"` in payloads), or
2. **Specific grade levels** (non-empty array of integer grade-level IDs in payloads, e.g. `[1, 2]`).

When a toggle is turned off, its grade-level field is omitted from the outgoing integration payloads.

---

## 2. Database Schema & Migration

### Schema Additions (`server/prisma/schema.prisma`)
Four new fields were added to the `TeacherDesignation` model (which stores school-year scoped assignments):

```prisma
model TeacherDesignation {
  // ... existing fields ...
  atlasAssignTeachingLoad             Boolean   @default(false) @map("atlas_assign_teaching_load")
  atlasAssignTeachingLoadAllGrades    Boolean   @default(true)  @map("atlas_assign_teaching_load_all_grades")
  atlasAssignTeachingLoadGradeLevelIds Int[]    @default([])    @map("atlas_assign_teaching_load_grade_level_ids")
  atlasBuildSchedules                 Boolean   @default(false) @map("atlas_build_schedules")
  atlasBuildSchedulesAllGrades        Boolean   @default(true)  @map("atlas_build_schedules_all_grades")
  atlasBuildSchedulesGradeLevelIds    Int[]     @default([])    @map("atlas_build_schedules_grade_level_ids")
  // ...
}
```

### Migration Applied
- **Migration:** `20261023125600_add_atlas_grade_level_toggles`
- Applied to PostgreSQL database and Prisma Client regenerated.

---

## 3. Backend & Save Path Fixes

### 1. Save Path Fix (`server/src/features/teachers/teachers.controller.ts`)
- Previously, `updateTeacher` only checked `ancillaryRoles !== undefined && req.schoolYearId` before touching `TeacherDesignation`. If an admin modified ATLAS toggles without changing ancillary roles, changes were silently dropped.
- Furthermore, `updateTeacher` previously returned the raw teacher record without `designation`, causing client-side state loss.
- **Fixed:** The controller now checks for changes in `atlasAssignTeachingLoad`, `atlasAssignTeachingLoadAllGrades`, `atlasAssignTeachingLoadGradeLevelIds`, `atlasBuildSchedules`, `atlasBuildSchedulesAllGrades`, and `atlasBuildSchedulesGradeLevelIds`. All fields are persisted via upsert and returned as `designation: savedDesignation`.

### 2. School-Year Rollover (`server/src/features/school-year/services/school-year-rollover.service.ts`)
- Rollover logic now propagates all 4 per-grade fields into designations cloned for the new school year.

### 3. Shared Schemas (`@enrollpro/shared`)
- Updated `teacherSchemaBase` and `teacherDesignationSchema` in `shared/src/schemas/teacher.schema.ts`.
- Added validation: if a toggle is enabled, either `allGrades` must be `true` or `gradeLevelIds` must contain at least one ID.
- Updated `companion-sso.schema.ts` to type `assignTeachingLoadGradeLevelIds` and `buildSchedulesGradeLevelIds` as `z.union([z.literal("ALL"), z.array(z.number().int().positive()).min(1)]).optional()`.

---

## 4. Payload Contract Implementation

Both integration surfaces have been updated to emit the exact payload requested:

### 1. Faculty Feed (`GET /api/integration/v1/faculty`)
Location: `server/src/features/integration/integration.controller.ts`

Both the top-level teacher row and the nested `companionAccess.atlas` object now include the new fields:

```json
{
  "schoolYearId": 4,
  "assignTeachingLoad": true,
  "buildSchedules": true,
  "gradeLevelIds": [1],
  "assignTeachingLoadGradeLevelIds": "ALL",
  "buildSchedulesGradeLevelIds": [1, 2]
}
```

#### Contract Rules Honored:
- **`assignTeachingLoad` / `buildSchedules`**: Booleans matching toggle state.
- **`gradeLevelIds`**: Preserved for backward compatibility (derived from coordinator roles; `null` if not role-restricted).
- **`assignTeachingLoadGradeLevelIds`**:
  - Emits `"ALL"` if all grades are selected or `allGrades === true`.
  - Emits `[<id>, ...]` if specific grades are selected.
  - **Omitted** when `assignTeachingLoad === false`.
  - **Never** `[]` or `null`.
- **`buildSchedulesGradeLevelIds`**:
  - Emits `"ALL"` if all grades are selected or `allGrades === true`.
  - Emits `[<id>, ...]` if specific grades are selected.
  - **Omitted** when `buildSchedules === false`.
  - **Never** `[]` or `null`.

### 2. Companion SSO Identity Exchange (`/api/auth/companion/token`)
Location: `server/src/features/auth/companion-sso.service.ts`

The returned `atlasAccess` object matches the exact structure above.

---

## 5. Admin UI Implementation

### Teacher Detail Modal (`client/src/features/teachers/components/TeacherDetailPanel.tsx`)
- **Grade Checkboxes under each toggle**:
  - When a toggle ("Assign Teaching Load" or "Build Schedules") is checked, a nested checklist of grade levels for the active school year is displayed, along with an **All grades** choice.
- **Synchronized Checkbox Behavior**:
  - Selecting "All grades" selects all available grade levels.
  - Unchecking any grade level automatically unchecks "All grades".
  - Selecting all individual grade levels automatically checks "All grades".
- **Validation**:
  - Saving with a toggle enabled and no grade selected is blocked by Zod and form validation with the message: *"Please select at least one grade level or All grades."*
- **View Mode**:
  - Displays formatted descriptions, e.g.:
    - `Assign Teaching Load: No`
    - `Build Schedules: Yes (Grade 7, Grade 8)`
    - or `Yes (All grades)`

---

## 6. Verification & Acceptance Criteria

### Test Execution on Teacher `1000015`
Per acceptance criteria in `enrollpro-per-grade-atlas-toggles-2026-10-21.md`:

1. Admin configures teacher `1000015` (Maria Angela Aquino) with:
   - **Build schedules:** `Grade 7, Grade 8` (Grade IDs `[1, 2]`)
   - **Assign teaching load:** `off`
2. Saved to database.
3. Queried integration faculty feed output:

```json
{
  "schoolYearId": 4,
  "assignTeachingLoad": false,
  "buildSchedules": true,
  "gradeLevelIds": null,
  "buildSchedulesGradeLevelIds": [1, 2]
}
```

### Build & Type Verification
- `pnpm --filter client build`: **Passed (Exit code 0)**
- `pnpm --filter server build`: **Passed (Exit code 0)**
- `eslint`: **Passed (0 errors, 0 warnings on modified files)**
- `pnpm docs:check`: **Passed (Exit code 0)**

---

## 7. Next Steps for ATLAS

EnrollPro changes are fully compatible with ATLAS Card 214 forward-compatible parsers. No further EnrollPro changes are required for this handoff.
