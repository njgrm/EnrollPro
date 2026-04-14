# Legacy Docs Supersession Map

Last updated: 2026-04-14

Purpose: identify which docs are implementation-authoritative versus legacy target-state narratives.

## 1. Authoritative implementation docs

Use these first for build, refactor, and QA decisions:

- [docs/core/CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md](CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md)
- [docs/core/MODULE_COVERAGE_MATRIX.md](MODULE_COVERAGE_MATRIX.md)
- [docs/core/REALITY_ALIGNMENT_NOTES.md](REALITY_ALIGNMENT_NOTES.md)
- [docs/core/API_NORMALIZATION_REST.md](API_NORMALIZATION_REST.md)
- [docs/core/DOMAIN_MODEL_REFINEMENT_PLAN.md](DOMAIN_MODEL_REFINEMENT_PLAN.md)
- [docs/core/ARCHITECTURE_REFACTOR_BLUEPRINT.md](ARCHITECTURE_REFACTOR_BLUEPRINT.md)
- [docs/core/SECURITY_AUDIT_TRAIL_BASELINE.md](SECURITY_AUDIT_TRAIL_BASELINE.md)
- [docs/core/SPEC_DRIVEN_WORKFLOW_IMPLEMENTATION.md](SPEC_DRIVEN_WORKFLOW_IMPLEMENTATION.md)
- [docs/features/admission/MODULE_1_EARLY_REGISTRATION_IMPLEMENTATION_SPEC.md](../features/admission/MODULE_1_EARLY_REGISTRATION_IMPLEMENTATION_SPEC.md)
- [docs/features/enrollment/MODULE_2_ENROLLMENT_IMPLEMENTATION_SPEC.md](../features/enrollment/MODULE_2_ENROLLMENT_IMPLEMENTATION_SPEC.md)
- [docs/features/sims/MODULE_3_SIMS_IMPLEMENTATION_SPEC.md](../features/sims/MODULE_3_SIMS_IMPLEMENTATION_SPEC.md)
- [docs/features/teachers/MODULE_4_TEACHER_MANAGEMENT_IMPLEMENTATION_SPEC.md](../features/teachers/MODULE_4_TEACHER_MANAGEMENT_IMPLEMENTATION_SPEC.md)
- [docs/features/academic-year/MODULE_5_GRADE_SECTIONING_IMPLEMENTATION_SPEC.md](../features/academic-year/MODULE_5_GRADE_SECTIONING_IMPLEMENTATION_SPEC.md)

## 2. Refreshed legacy core docs (now aligned)

These older filenames were retained but content was updated to match current code:

- [docs/core/APPLICATION_STATUS_LIFECYCLE.md](APPLICATION_STATUS_LIFECYCLE.md)
- [docs/core/LEARNER_STATUS_GUIDE.md](LEARNER_STATUS_GUIDE.md)
- [docs/core/JWT_IMPLEMENTATION.md](JWT_IMPLEMENTATION.md)
- [docs/core/TECH_STACK_AND_SCHEMA.md](TECH_STACK_AND_SCHEMA.md)
- [docs/core/DB_NAMING_CONVENTIONS.md](DB_NAMING_CONVENTIONS.md)

## 3. Legacy target-state docs to treat as planning-only

These documents can still provide product intent, but they must not override implemented behavior without code changes:

- [docs/core/PRD.md](PRD.md)
- [docs/features/admission/SCP_STORYBOARD.md](../features/admission/SCP_STORYBOARD.md)
- [docs/features/enrollment/REGISTRAR_WORKFLOW.md](../features/enrollment/REGISTRAR_WORKFLOW.md)
- [docs/features/sims/SIMS_SPEC.md](../features/sims/SIMS_SPEC.md)
- [docs/features/system-admin/ADMIN_SPEC.md](../features/system-admin/ADMIN_SPEC.md)

## 4. Decision rule

When an old spec conflicts with runtime behavior:

1. trust server and shared code,
2. update docs first,
3. then schedule code changes using the implementation specs.
