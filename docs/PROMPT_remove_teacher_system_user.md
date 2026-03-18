# Claude Code Prompt — Remove TEACHER as System User

## Architectural Decision

The capstone adviser has confirmed that **teachers are NOT system users**. They do not have login accounts and cannot access the system. The `TEACHER` role is removed entirely from the authentication system.

The `Teacher` model remains in the database as a **data record only** — used for section adviser assignment and subject tracking. It is managed exclusively by the SYSTEM_ADMIN through the Teacher Management module.

Apply all changes below precisely. Do not add, remove, or restructure anything beyond what is specified.

---

## 1. Database Schema — `server/prisma/schema.prisma`

### 1.1 Remove `TEACHER` from the `Role` enum

```prisma
// BEFORE
enum Role {
  TEACHER
  REGISTRAR
  SYSTEM_ADMIN
}

// AFTER
enum Role {
  REGISTRAR
  SYSTEM_ADMIN
}
```

### 1.2 Remove `userId` from the `Teacher` model — remove the User relation

```prisma
// BEFORE
model Teacher {
  id              Int       @id @default(autoincrement())
  userId          Int       @unique  // links to a User with role: TEACHER
  employeeId      String?   @unique
  firstName       String
  lastName        String
  middleName      String?
  contactNumber   String?
  specialization  String?
  subjects        String[]  @default([])
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sections        Section[]
}

// AFTER
// Teachers are NOT system users — no login account, no userId link.
// This model exists for section adviser assignment and subject tracking only.
model Teacher {
  id              Int       @id @default(autoincrement())
  employeeId      String?   @unique
  firstName       String
  lastName        String
  middleName      String?
  contactNumber   String?
  specialization  String?
  subjects        String[]  @default([])
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  sections        Section[]
}
```

### 1.3 Remove `teacherProfile Teacher?` from the `User` model

```prisma
// BEFORE
model User {
  ...
  teacherProfile     Teacher?
  sections           Section[]  // sections advised (legacy join, use Teacher relation primarily)
  enrollments        Enrollment[]
  ...
}

// AFTER
model User {
  ...
  enrollments        Enrollment[]
  ...
  // role field comment: role is REGISTRAR or SYSTEM_ADMIN only
}
```

### 1.4 Generate and apply the migration

```bash
pnpm prisma migrate dev --name remove_teacher_as_system_user
```

---

## 2. File: `Sidebar_TEACHER.md`

Add the following block at the very top of the file, above everything else including the title:

```markdown
> ⚠️ **SUPERSEDED — v3.1.0**
> This document is no longer valid. The TEACHER role has been removed from the system.
> Teachers are not system users and do not have login accounts.
> Teacher records are managed by the SYSTEM_ADMIN via `/teachers`.
> This file is retained for historical reference only.

---
```

---

## 3. File: `JWT_IMPLEMENTATION.md`

### 3.1 In the "Common Errors & Fixes" section, update the `403 Forbidden` example

Find:
```
The user's role does not match what `authorize()` requires for that route. Example: a TEACHER navigating to `/api/applications`. Check `SidebarContent.tsx` role guards to prevent the UI from surfacing this link to unauthorized roles.
```

Replace with:
```
The user's role does not match what `authorize()` requires for that route. Example: a REGISTRAR attempting to access `/api/teachers`, which is SYSTEM_ADMIN exclusive. Check `SidebarContent.tsx` role guards to prevent the UI from surfacing this link to unauthorized roles.
```

---

## 4. File: `Sidebar_navigation.md`

### 4.1 In the Dashboard per-item detail, remove the TEACHER view paragraph

Find and delete this entire block:
```markdown
**TEACHER view:**
- Section enrollment counts for own sections only
- No stat cards for system-wide stats
- No action buttons
```

### 4.2 Remove the entire "My Sections" per-item detail section

Find and delete:
```markdown
### My Sections — `/my-sections` (TEACHER only)

```
Icon  : BookOpen
Route : /my-sections + /my-sections/:id
Auth  : JWT required — TEACHER
Pages : client/src/pages/sections/MySections.tsx
        client/src/pages/sections/SectionRoster.tsx
API   : GET /api/teacher/sections
        GET /api/teacher/sections/:id
```

Shows only sections where `advisingTeacherId` matches the logged-in teacher's Teacher record.

---
```

### 4.3 Update the Role Badge Reference table

Find:
```markdown
| `TEACHER` | Teacher | Blue |
```
Delete that entire row.

### 4.4 Update the Implementation Notes section

Find:
```tsx
const isTeacher   = user?.role === 'TEACHER';
```
Delete that line.

Find:
```tsx
{isTeacher && <NavItem href="/my-sections" icon={BookOpen} label="My Sections" />}
```
Delete that line.

### 4.5 In User Management per-item detail, update the description

Find:
```
Create, edit, deactivate REGISTRAR and TEACHER accounts. SYSTEM_ADMIN role cannot be assigned through the UI.
```

Replace with:
```
Create, edit, and deactivate REGISTRAR accounts. SYSTEM_ADMIN role cannot be assigned through the UI. Teachers are managed separately in `/teachers` (not through User Management).
```

---

## 5. File: `Sidebar_REGISTRAR.md`

### 5.1 Remove Teachers from the sidebar anatomy diagram

In the sidebar anatomy at the top of the file, find and delete:
```
│  🎓  Teachers                        │  /teachers
```

### 5.2 Remove the entire "Navigation Item 6 — Teachers" section

Delete the full section starting with `## Navigation Item 6 — Teachers` through to the next `---` separator. This includes all subsections (Teacher Directory, Teacher Profile tabs, provision account dialog, all API endpoints listed under it).

### 5.3 Renumber all items after the deleted Teachers section

- What was **Item 7 — Sections** → rename to **Item 6 — Sections**
- What was **Item 8 — Settings** → rename to **Item 7 — Settings**

### 5.4 Update the Complete Route Table

Remove all rows for `/teachers` and `/teachers/:id` from the Complete Route Table at the bottom of the file.

### 5.5 Add a note after Item 5 (Audit Logs) explaining Teachers is SYSTEM_ADMIN only

After the Audit Logs section and before the Sections section, insert:

```markdown
> **Note:** The Teacher Management module (`/teachers`) is **not accessible to REGISTRAR**. It is exclusively managed by the SYSTEM_ADMIN. The registrar can still assign advising teachers to sections via the teacher name dropdown in `/sections` — the dropdown is populated from the Teacher directory — but cannot create or edit teacher profiles.

```

### 5.6 Update the SidebarContent.tsx snippet at the bottom

Find:
```tsx
    <SidebarSection label="Management">
      <NavItem href="/teachers"       icon={GraduationCap}   label="Teachers" />
      <NavItem href="/sections"       icon={School}          label="Sections" />
      <NavItem href="/settings"       icon={Settings}        label="Settings" />
    </SidebarSection>
```

Replace with:
```tsx
    <SidebarSection label="Management">
      <NavItem href="/sections"       icon={School}          label="Sections" />
      <NavItem href="/settings"       icon={Settings}        label="Settings" />
    </SidebarSection>
```

---

## 6. File: `Sidebar_SYSTEM_ADMIN.md`

### 6.1 Update the "Key Distinctions from REGISTRAR" table

Find the row:
```
| Teacher Profile — Deactivate Account | ❌ | ✅ |
| Teacher Profile — Reset Password | ❌ | ✅ |
```

Replace both rows with:
```
| Teacher Management (`/teachers`) — full CRUD | ❌ | ✅ (exclusive) |
```

### 6.2 Update the sidebar anatomy diagram

Find in the `── MANAGEMENT ──` section:
```
│  🎓  Teachers                        │  /teachers
│  🏫  Sections                        │  /sections
│  ⚙️   Settings                        │  /settings
│                                      │
│  ── SYSTEM ──                        │
│  🛡️   User Management                 │  /admin/users
│  📧  Email Logs                      │  /admin/email-logs
│  📡  System Health                   │  /admin/system
```

Replace with:
```
│  🏫  Sections                        │  /sections
│  ⚙️   Settings                        │  /settings
│                                      │
│  ── SYSTEM ──                        │
│  🎓  Teachers                        │  /teachers
│  🛡️   User Management                 │  /admin/users
│  📧  Email Logs                      │  /admin/email-logs
│  📡  System Health                   │  /admin/system
```

### 6.3 In "Item 6 — Teachers" section, completely rewrite the content

Find the section `### Item 6 — Teachers (\`/teachers\`) — Admin Additions` and replace its entire content (everything until the next `###` heading) with:

```markdown
### Item 9 — Teachers (`/teachers`) — SYSTEM_ADMIN Exclusive

```
Group  : SYSTEM
Icon   : GraduationCap
Label  : Teachers
Route  : /teachers  (directory)
         /teachers/:id  (profile)
Auth   : JWT required — SYSTEM_ADMIN only
Page   : client/src/pages/teachers/Index.tsx
         client/src/pages/teachers/Profile.tsx
API    : GET   /api/teachers
         POST  /api/teachers
         GET   /api/teachers/:id
         PUT   /api/teachers/:id
         PATCH /api/teachers/:id/deactivate
```

**Purpose:** Manage the school's teacher directory. Teachers are **not system users** — they have no login accounts. This module manages teacher records for section adviser assignment and subject tracking only.

**Teacher Directory:**
- Columns: Employee ID · Full Name · Specialization · Subjects · Assigned Sections (count) · Actions
- Create Teacher: Last Name · First Name · Middle Name · Employee ID · Contact Number · Specialization · Subjects (multi-select from DepEd-defined list)
- No "Account Status" column — teachers have no accounts
- No "Provision Account" action

**Teacher Profile (2 tabs):**

Tab 1 — Profile: Full Name, Employee ID, Contact Number, Specialization, Subjects. All editable by SYSTEM_ADMIN.

Tab 2 — Assigned Sections: All sections this teacher advises in the active AY. "Unassign" removes the adviser from that section.

**No Tab 3 (System Account)** — teachers have no system accounts to manage.
```

### 6.4 Update the Role Badge Reference (remove Teacher's blue badge)

Find:
```
| `TEACHER` | Teacher | Blue |
```
Remove that row entirely from whatever table it appears in within this file.

### 6.5 In User Management section, update the Create User description

Find any text saying:
```
Role can be changed between REGISTRAR and TEACHER
```
or
```
Create REGISTRAR or TEACHER account
```

Replace with:
```
Role: REGISTRAR only. Teachers are managed separately via /teachers and are not system users.
```

### 6.6 Update the SidebarContent.tsx snippet at the bottom

Find the shared block and admin block. Replace the entire snippet with:

```tsx
// Items 1–7: shared between REGISTRAR and SYSTEM_ADMIN
{(isRegistrar || isAdmin) && (
  <>
    <SidebarSection label="Admission">
      <NavItem href="/f2f-admission"      icon={UserPlus}        label="Walk-in Admission" />
    </SidebarSection>

    <SidebarSection label="Enrollment">
      <NavItem href="/dashboard"          icon={LayoutDashboard} label="Dashboard" />
      <NavItem href="/applications"       icon={ClipboardList}   label="Applications" />
    </SidebarSection>

    <SidebarSection label="Records">
      <NavItem href="/students"           icon={Users}           label="Students" />
      <NavItem href="/audit-logs"         icon={ScrollText}      label="Audit Logs" />
    </SidebarSection>

    <SidebarSection label="Management">
      <NavItem href="/sections"           icon={School}          label="Sections" />
      <NavItem href="/settings"           icon={Settings}        label="Settings" />
    </SidebarSection>
  </>
)}

// SYSTEM_ADMIN exclusive
{isAdmin && (
  <SidebarSection label="System">
    <NavItem href="/teachers"             icon={GraduationCap}   label="Teachers" />
    <NavItem href="/admin/users"          icon={Shield}          label="User Management" />
    <NavItem href="/admin/email-logs"     icon={Mail}            label="Email Logs" />
    <NavItem href="/admin/system"         icon={Activity}        label="System Health" />
  </SidebarSection>
)}
```

### 6.7 Update the Complete Route Table

In the "Inherited from REGISTRAR" table, remove the rows for `/teachers` and `/teachers/:id`.

In the "Exclusive to SYSTEM_ADMIN" table, add a Teachers row as the first entry:

```markdown
| `/teachers` | `Teachers.tsx` | `GET/POST/PUT/PATCH /api/teachers/*` |
| `/teachers/:id` | `TeacherProfile.tsx` | `GET/PUT/PATCH /api/teachers/:id` |
```

---

## 7. File: `System_admin_specification.md`

### 7.1 Remove TEACHER from the capability matrix

Find the matrix that has `| Capability | TEACHER | REGISTRAR | SYSTEM_ADMIN |` as its header.

Replace the entire matrix with a 2-column version (remove TEACHER column entirely). The TEACHER column is removed from every row. The matrix header becomes `| Capability | REGISTRAR | SYSTEM_ADMIN |`.

Also remove any capability rows that referenced TEACHER-specific features (e.g., "View own assigned sections ✅ for TEACHER").

### 7.2 Remove TEACHER from the role hierarchy diagram

Find any ASCII diagram or text that lists `TEACHER` as one of the three roles. Remove TEACHER entirely from the diagram. The system has two authenticated roles: REGISTRAR and SYSTEM_ADMIN.

### 7.3 Update §4.5 Teacher Management (rename and rewrite)

Find the current `### 4.5 Teacher Management` section. Rewrite its content entirely:

```markdown
### 4.5 Teacher Management

**Route:** `/teachers` — **SYSTEM_ADMIN exclusive**

Teachers are not system users. They have no login accounts, no JWT, and no access to any part of the system. The Teacher Management module allows the System Admin to maintain the school's teacher directory for the purpose of section adviser assignment and subject tracking.

**What the System Admin can do:**
- Create teacher profiles (name, employee ID, contact, specialization, subjects)
- Edit teacher profiles
- View which sections a teacher is currently assigned to advise
- Deactivate a teacher record (soft delete — sets `isActive = false`)

**What does NOT exist (teachers are not system users):**
- No "Provision Account" action
- No account status field
- No password reset
- No login history
- No welcome email
- No Tab 3 (System Account) on the teacher profile

**Access restriction:** `GET /api/teachers`, `POST /api/teachers`, `PUT /api/teachers/:id`, and `PATCH /api/teachers/:id/deactivate` all require `authorize('SYSTEM_ADMIN')`. A REGISTRAR JWT returns `403 Forbidden` on all of these endpoints.
```

### 7.4 Update the full role access matrix (§5 or wherever it appears)

Find the matrix with header `| Route / Feature | TEACHER | REGISTRAR | SYSTEM_ADMIN |`.

Remove the TEACHER column entirely. Change the header to `| Route / Feature | REGISTRAR | SYSTEM_ADMIN |`.

Remove the `/my-sections` row entirely.

Change the `/teachers` row so REGISTRAR shows `❌` and SYSTEM_ADMIN shows `✅`.

### 7.5 Update the API Endpoints section (§6)

Find any table listing `POST /api/admin/users — Create REGISTRAR or TEACHER account`.

Replace with:
```
POST /api/admin/users — Create REGISTRAR account (SYSTEM_ADMIN only; teachers are not system users)
```

Find any reference to `PUT /api/admin/users/:id — Update name / email / role (REGISTRAR↔TEACHER only)`.

Replace with:
```
PUT /api/admin/users/:id — Update name / email (REGISTRAR accounts only)
```

### 7.6 Remove all `/my-sections` references

Find and delete any row, bullet, or mention of `/my-sections` anywhere in the file.

### 7.7 Update the navigation restriction note near the bottom

Find:
```
Navigation to admin routes while authenticated as REGISTRAR or TEACHER returns a `403 Forbidden` page.
```

Replace with:
```
Navigation to admin routes while authenticated as REGISTRAR returns a `403 Forbidden` page.
```

---

## 8. File: `Registrar_Storyboard_Workflow.md`

### 8.1 Update the document header — Supporting Actor

Find:
```
**Supporting Actor:** Advising Teacher (role: `TEACHER`) · System Administrator (role: `SYSTEM_ADMIN`)
```

Replace with:
```
**Supporting Actor:** System Administrator (role: `SYSTEM_ADMIN`)
```

### 8.2 Update the System Navigation Map

In the sidebar navigation map at the top of the document, find:
```
├─ 🎓  /teachers        — Teacher directory; create profiles; provision system accounts
```

Delete that line entirely. The REGISTRAR navigation map should not include `/teachers`.

### 8.3 Remove Scene 0.7 — Managing the Teacher Directory

Delete the entire scene block from `## SCENE 0.7 — Managing the Teacher Directory` through to the `---` separator that ends the scene. This includes all sub-sections:
- Creating a Teacher Profile
- Provisioning a System Login Account
- Editing a Teacher Profile
- Deactivating a Teacher Account

Replace the deleted scene with a single brief note:

```markdown
## Note — Teacher Management

Teacher profiles are managed by the **System Administrator**, not the Registrar. The System Admin creates and maintains teacher records via `/teachers` (SYSTEM_ADMIN exclusive route). The registrar can still assign advising teachers to sections by selecting from the teacher name dropdown in the Create/Edit Section dialog — this dropdown is populated from the teacher directory maintained by the System Admin.

---
```

### 8.4 Update Scene 0.6 — Building All Sections

In Scene 0.6, find the Create Section dialog mockup that says:

```
│  Advising Teacher (optional)                         │
│  [ Santos, Caridad                            ▾ ]    │
│  (loaded from Teacher directory — see Scene 0.7)     │
```

Change the parenthetical note to:
```
│  (loaded from Teacher directory — managed by System Admin)   │
```

### 8.5 Update Scene 3.4 — Adjusting Section Capacity or Reassigning Adviser

Find the sentence:
```
The old teacher loses the section assignment; the new teacher gains it in `/my-sections`.
```

Replace with:
```
The old teacher loses the section assignment in the system; the new teacher gains it. Both changes are visible in the System Admin's teacher profile view under Tab 2 — Assigned Sections.
```

### 8.6 Remove the SPI visibility note referencing TEACHER

Find:
```
These SPI fields are **only visible to REGISTRAR and SYSTEM_ADMIN**. TEACHER cannot see them.
```

Replace with:
```
These SPI fields are **only visible to REGISTRAR and SYSTEM_ADMIN**.
```

### 8.7 Remove the entire "SPECIAL SCENARIO T — ADVISING TEACHER LOGIN" section

Delete everything from:
```
# ═══════════════════════════════════════════
# SPECIAL SCENARIO T — ADVISING TEACHER LOGIN
# ═══════════════════════════════════════════
```

Through to the end of `## SCENE T.2 — Teacher Views Their Section Class List` including all its content, up to but not including the next `# APPENDIX` heading.

---

## 9. File: `Deped_admission_process_fields.md`

### 9.1 Update the Module 4 cross-module notes

Find in Section 10 (System Design Notes), under Module 4 — Teacher Management, any text that says:

```
When the registrar provisions a system account for a teacher...
```
or
```
Teacher account provisioning...
```
or any reference to teacher login, welcome email for login purposes, or `/my-sections`.

Replace the entire Module 4 paragraph with:

```markdown
### Module 4 — Teacher Management

Teacher records are **not linked to User accounts**. Teachers have no system login. The Teacher model exists purely as a data record for:
1. Section adviser assignment — the `Section.advisingTeacherId` foreign key points to `Teacher.id`
2. Subject tracking — `Teacher.subjects` stores the DepEd-defined subjects the teacher handles

The connection from BEEF/admission data to Teacher Management is indirect:

```
Applicant (gradeLevelId)
    ↓ enrolled into
Enrollment (sectionId)
    ↓ section is advised by
Section (advisingTeacherId → Teacher.id)
```

Teacher records are managed exclusively by the SYSTEM_ADMIN at `/teachers`. The registrar does not have access to Teacher Management — but when assigning a section to an applicant, the section's adviser name (from the Teacher directory) is displayed in the section assignment dialog.
```

---

## 10. File: `F2F_Admission_Storyboard.md`

Search the entire file for any reference to:
- `TEACHER` role
- `/my-sections`
- "teacher's system account"
- "provision account"
- "teacher login"
- `mustChangePassword` in the context of a teacher

If any are found, remove them. This file should only reference REGISTRAR and SYSTEM_ADMIN as system roles. Teachers appear only as data entities (adviser names on sections), not as system users.

---

## 11. File: `DepEd_Curriculum_Subjects_G7_G12.md`

### 11.1 Update the API Contract section

Find:
```
GET /api/curriculum/subjects
Authorization: Bearer <JWT>  (REGISTRAR or SYSTEM_ADMIN)
```

No change needed — this is correct. REGISTRAR and SYSTEM_ADMIN both access this endpoint (REGISTRAR needs it for the section assignment dropdown; SYSTEM_ADMIN needs it for Teacher Management).

Find in the route handler:
```ts
router.get('/subjects',
  authenticate,
  authorize('REGISTRAR', 'SYSTEM_ADMIN'),
  ...
```

No change needed.

### 11.2 Update the Teacher Profile UI Mockup section

Find any reference to "registrar" entering or editing subjects on the teacher profile.

Replace all occurrences of "registrar" in this context with "System Admin" or "admin".

Example: find `The registrar selects subjects...` → replace with `The System Admin selects subjects...`

---

## 12. Files with NO changes needed

The following files require no changes — they either do not reference the TEACHER role or their TEACHER references are already correct after the previous partial patches:

- `ACCENT_COLOR_VARIABLES.md` — no role references
- `Admission_form_ux_spec.md` — no role references
- `DepEd_Enrollment_Process.md` — no role references
- `School_Year_Setup_Architecture.md` — no role references
- `PRD.md` — already patched in the previous session
- `JWT_IMPLEMENTATION.md` — mostly patched; only the one error example fix above needed

---

## Summary of What Changes

| What | Before | After |
|---|---|---|
| `Role` enum | `TEACHER, REGISTRAR, SYSTEM_ADMIN` | `REGISTRAR, SYSTEM_ADMIN` |
| `Teacher.userId` | Required FK to `User` | Removed entirely |
| `User.teacherProfile` | Present | Removed |
| Teacher Management route auth | `REGISTRAR, SYSTEM_ADMIN` | `SYSTEM_ADMIN` only |
| `/teachers` in REGISTRAR sidebar | ✅ (Item 6 of 8) | ❌ Removed |
| `/teachers` in SYSTEM_ADMIN sidebar | In MANAGEMENT group | Moved to SYSTEM group |
| Teacher profile tabs | 3 tabs (Profile, Sections, **System Account**) | 2 tabs (Profile, Sections) |
| `/my-sections` route | Existed for TEACHER role | Removed entirely |
| `/api/teacher/sections` endpoints | Existed | Removed entirely |
| `my-sections.routes.ts` | Existed | Deleted |
| Scene 0.7 in Storyboard | Full teacher account provisioning scene | Replaced with brief note |
| Special Scenario T in Storyboard | 2 scenes (T.1 login, T.2 class list) | Removed entirely |
| Prisma migration | — | `remove_teacher_as_system_user` |
