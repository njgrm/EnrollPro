# Module Coverage Matrix (Code-First)

Last updated: 2026-04-14

## Scope reminder

Primary deep scope:

- Module 1: Early Registration
- Module 2: Enrollment Management
- Module 3: SIMS
- Module 4: Teacher Management
- Module 5: Grade Level and Sectioning Management

## Coverage matrix

| Module                        | Current coverage  | Key implementation files                                                                                                                                                                                                                                                                                                                                                              | Main gaps                                                                                                                                     |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Early Registration         | Partial to strong | server/src/features/admission/admission.router.ts, server/src/features/admission/early-registration.controller.ts, server/src/features/early-registration/early-reg.router.ts, server/src/features/early-registration/early-reg.controller.ts, client/src/features/admission/pages/apply, client/src/features/admission/pages/f2f, client/src/features/early-registration/pages/apply | Duplicate flows and contracts; mixed status semantics in UX copy; no single orchestration service                                             |
| 2. Enrollment Management      | Partial           | server/src/features/admission/early-registration.controller.ts (enroll and temporarily enroll paths), server/src/features/enrollment/enrollment-requirement.service.ts, client/src/features/enrollment/pages/Index.tsx, client/src/features/enrollment/components/\*                                                                                                                  | Enrollment logic embedded in admission controller; no dedicated enrollment controller/router module; panel interactions not keyboard-friendly |
| 3. SIMS                       | Partial           | server/src/features/students/students.router.ts, server/src/features/students/students.controller.ts, server/src/features/students/students.service.ts, client/src/features/students/pages/Index.tsx, client/src/features/students/pages/Profile.tsx                                                                                                                                  | Health records implemented, but no Brigada reading workflow and no LIS export pipeline                                                        |
| 4. Teacher Management         | Basic to moderate | server/src/features/teachers/teachers.router.ts, server/src/features/teachers/teachers.controller.ts, client/src/features/teachers/pages/Index.tsx                                                                                                                                                                                                                                    | No assignment/scheduling workload model; limited validation and no deeper teaching load analytics                                             |
| 5. Grade Level and Sectioning | Basic to moderate | server/src/features/curriculum/curriculum.router.ts, server/src/features/curriculum/curriculum.controller.ts, server/src/features/sections/sections.router.ts, server/src/features/sections/sections.controller.ts, client/src/features/sections/pages/Index.tsx, client/src/features/settings/pages/CurriculumTab.tsx                                                                | No autonomous sectioning engine; no priority-based batch placement workflow from ENROLLED pool                                                |

## Objectives 6-10 summary mapping

| Objective                                           | Current status                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 6. Teacher account provisioning                     | Implemented via admin user management + teacher CRUD, but role model needs enum alignment clarity |
| 7. Grade and section management                     | Implemented basic CRUD + capacity heatmap; no autonomous placement engine                         |
| 8. Academic year configuration                      | Implemented with smart date derivation and active SY switching                                    |
| 9. Dynamic school configuration and visual identity | Implemented logo upload, palette extraction, accent selection, and runtime theme application      |
| 10. Audit trail and activity logging                | Backend implemented; frontend page still placeholder                                              |

## Online vs F2F support map

| Domain                  | Online flow                                                              | F2F flow                                                                   |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Admission intake        | Public submit endpoint in /api/applications and /api/early-registrations | Authenticated registrar/admin intake endpoints in both modules             |
| Enrollment finalization | Staff-driven (no public finalization)                                    | Staff-driven (same backend, channel-aware metadata mostly at intake stage) |
| SIMS updates            | Not public                                                               | Staff-only via students routes                                             |

## Implementation sequence recommendation

1. Stabilize module docs and contracts (this pack).
2. Consolidate duplicated admission forms and status labels.
3. Introduce dedicated enrollment controller and routes.
4. Implement missing audit/admin pages on client.
5. Add section placement orchestration as explicit service.
