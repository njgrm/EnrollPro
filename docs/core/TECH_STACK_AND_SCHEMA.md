# Tech Stack and Schema Baseline (Implementation-Aligned)

Last updated: 2026-04-14

## 1. Stack baseline

- PostgreSQL (via Prisma datasource)
- Prisma ORM v6
- Express v5
- Node.js 22 LTS policy at workspace root
- React 19 + TypeScript + Tailwind CSS v4

## 2. Monorepo packages

- client: UI and route workflows
- server: API, business logic, and persistence
- shared: constants and Zod contracts shared by client and server

## 3. Core implemented schema domains

Identity and auth:

- User

School-year and configuration:

- SchoolSetting
- SchoolYear
- GradeLevel
- Section
- ScpProgramConfig, ScpProgramStep, ScpProgramOption

Admission and enrollment:

- Applicant
- ApplicantAddress
- ApplicantFamilyMember
- ApplicantPreviousSchool
- ApplicantAssessment
- ApplicantProgramDetail
- ApplicantDocument
- ApplicantChecklist
- Enrollment

SIMS and learner access:

- HealthRecord
- Learner lookup and portal PIN flow via Applicant fields

DO 017 lane:

- EarlyRegistrant
- EarlyRegistrantGuardian
- EarlyRegistration

Observability:

- AuditLog
- EmailLog

## 4. Canonical enums in use

Roles:

- REGISTRAR
- SYSTEM_ADMIN

Application statuses:

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

School year statuses:

- DRAFT
- UPCOMING
- ACTIVE
- ARCHIVED

## 5. Implementation note

Some older docs describe target-state statuses and role sets that are not yet implemented.

For code-first engineering decisions, use this file together with:

- [CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md](CODEBASE_AUDIT_IMPLEMENTATION_BASELINE.md)
- [REALITY_ALIGNMENT_NOTES.md](REALITY_ALIGNMENT_NOTES.md)
