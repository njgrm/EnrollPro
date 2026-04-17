# Database Naming Conventions (Schema-Aligned)

Last updated: 2026-04-17

## 1. Naming philosophy

1. SQL tables, columns, enum types, constraints, and indexes use snake_case.
2. Prisma models use PascalCase.
3. Prisma fields use camelCase and map to SQL snake_case with @map when needed.
4. Constraint and index names are explicit (no implicit generated names in schema).

## 2. Current table names (from schema.prisma)

- users
- teachers
- school_settings
- school_years
- grade_levels
- sections
- learners
- early_registration_applications
- early_registration_assessments
- enrollment_applications
- enrollment_previous_schools
- enrollment_program_details
- application_addresses
- application_family_members
- application_checklists
- enrollment_records
- departments
- audit_logs
- email_logs
- health_records
- scp_program_configs
- scp_program_steps
- scp_program_options
- teacher_subjects

## 3. Column naming conventions

1. Foreign keys use <entity>\_id (examples: learner_id, school_year_id, encoded_by_id).
2. Boolean columns use is*\*/has*\* prefixes (examples: is_active, has_no_father, is_profile_locked).
3. Timestamp columns use \*\_at (examples: created_at, updated_at, verified_at, enrolled_at).
4. Date-only columns use \*\_date (examples: class_opening_date, assessment_date, documentary_deadline_at).
5. Multi-word column names remain snake_case (examples: city_municipality, learning_modalities, selected_accent_hsl).

## 4. Constraint and index naming conventions

Unique constraints:

- Prefix: uq\_
- Pattern: uq*<domain>*<field_or_purpose>
- Examples:
  - uq_users_email
  - uq_learners_lrn
  - uq_early_reg_tracking_number
  - uq_enrollment_tracking_number
  - uq_scp_program_configs_type

Indexes:

- Prefix: idx\_
- Pattern: idx*<domain>*<field_or_purpose>
- Examples:
  - idx_grade_levels_school_year_id
  - idx_sections_grade_level_program_type
  - idx_early_reg_sy_status
  - idx_enrollment_apps_status_sy
  - idx_health_records_learner_id

Note:

- Domain segments can be full names (health_records, sections) or established abbreviations (early_reg, enroll) as used by the current schema.

## 5. Enum baseline (current schema)

Role (user_role):

- REGISTRAR
- SYSTEM_ADMIN
- TEACHER

ComplianceStatus (compliance_status):

- PENDING
- COMPLIED
- OVERDUE

PrimaryContactType (primary_contact_type):

- FATHER
- MOTHER
- GUARDIAN

Sex (sex):

- MALE
- FEMALE

ApplicationStatus (application_status):

- SUBMITTED
- VERIFIED
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

SchoolYearStatus (school_year_status):

- DRAFT
- UPCOMING
- ACTIVE
- ARCHIVED

ApplicantType (applicant_type):

- REGULAR
- SCIENCE_TECHNOLOGY_AND_ENGINEERING
- SPECIAL_PROGRAM_IN_THE_ARTS
- SPECIAL_PROGRAM_IN_SPORTS
- SPECIAL_PROGRAM_IN_JOURNALISM
- SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE
- SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION

EmailTrigger (email_trigger):

- APPLICATION_SUBMITTED
- APPLICATION_APPROVED
- APPLICATION_REJECTED
- EXAM_SCHEDULED
- ASSESSMENT_PASSED
- ASSESSMENT_FAILED

EmailStatus (email_status):

- PENDING
- SENT
- FAILED

AdmissionChannel (admission_channel):

- ONLINE
- F2F

DocumentType (document_type):

- PSA_BIRTH_CERTIFICATE
- SECONDARY_BIRTH_PROOF
- SF9_REPORT_CARD
- SF10_PERMANENT_RECORD
- GOOD_MORAL_CERTIFICATE
- MEDICAL_CERTIFICATE
- CERTIFICATE_OF_RECOGNITION
- MEDICAL_EVALUATION
- PEPT_AE_CERTIFICATE
- PWD_ID
- PSA_MARRIAGE_CERTIFICATE
- UNDERTAKING
- AFFIDAVIT_OF_UNDERTAKING
- CONFIRMATION_SLIP
- WRITING_PORTFOLIO
- OTHERS

LearnerType (learner_type):

- NEW_ENROLLEE
- TRANSFEREE
- RETURNING
- CONTINUING
- OSCYA
- ALS

AssessmentPeriod (assessment_period):

- BOSY
- EOSY

AddressType (address_type):

- CURRENT
- PERMANENT

FamilyRelationship (family_relationship):

- MOTHER
- FATHER
- GUARDIAN

AssessmentKind (assessment_kind):

- INTERVIEW
- QUALIFYING_EXAMINATION
- PRELIMINARY_EXAMINATION
- FINAL_EXAMINATION
- GENERAL_ADMISSION_TEST
- TALENT_AUDITION
- PHYSICAL_FITNESS_TEST
- SPORTS_SKILLS_TRYOUT
- SKILLS_ASSESSMENT
- STANDARDIZED_ADMISSION_TOOL
- APTITUDE_TEST
- INTEREST_INVENTORY

ScpOptionType (scp_option_type):

- ART_FIELD
- LANGUAGE
- SPORT

## 6. Drift guardrails

Before merging schema changes:

1. Confirm new SQL names are snake_case and Prisma mappings stay explicit.
2. Keep unique and index names on uq*/idx* prefixes with descriptive domains.
3. Update shared constants, Zod schemas, and controller/service logic for semantic changes.
4. Update this document whenever model names, enum values, or naming patterns change.
