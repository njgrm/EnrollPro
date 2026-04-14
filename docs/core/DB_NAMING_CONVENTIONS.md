# Database Naming Conventions (Implementation-Aligned)

Last updated: 2026-04-14

## 1. Naming philosophy

1. SQL objects use snake_case.
2. Prisma models use PascalCase.
3. Prisma fields use camelCase with explicit @map for SQL column names.
4. Constraint and index names are explicit and descriptive.

## 2. Table naming examples from current schema

- users
- school_settings
- school_years
- grade_levels
- sections
- applicants
- applicant_addresses
- applicant_family_members
- applicant_previous_schools
- applicant_assessments
- applicant_program_details
- applicant_documents
- applicant_checklists
- enrollments
- health_records
- early_registrants
- early_registrant_guardians
- early_registrations
- audit_logs
- email_logs

## 3. Column naming conventions

1. Foreign keys use <entity>\_id.
2. Booleans use is* or has* prefixes.
3. Timestamp columns use \*\_at.
4. Date-only values are stored as Date or normalized timestamps by service policy.

## 4. Constraint naming conventions

Unique constraints:

- uq*<table>*<field(s)>

Indexes:

- idx*<table>*<field(s)>

## 5. Enum baseline (current implementation)

Role (user_role):

- REGISTRAR
- SYSTEM_ADMIN

ApplicationStatus (application_status):

- SUBMITTED
- UNDER_REVIEW
- FOR_REVISION
- ELIGIBLE
- ASSESSMENT_SCHEDULED
- ASSESSMENT_TAKEN
- PASSED
- INTERVIEW_SCHEDULED
- PRE_REGISTERED
- TEMPORARILY_ENROLLED
- NOT_QUALIFIED
- ENROLLED
- REJECTED
- WITHDRAWN

## 6. Drift guardrails

Before merging schema changes:

1. confirm names follow existing patterns,
2. ensure shared constants and zod schemas are updated,
3. update docs if enum or model semantics change,
4. verify route/controller behavior for new fields.
