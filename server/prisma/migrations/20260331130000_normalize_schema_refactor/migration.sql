-- Normalize schema: remove redundant isActive, fix enum mismatches, add indexes

------------------------------------------------------------
-- 1. Drop redundant is_active column from school_years
--    (status enum already tracks ACTIVE; this was a 3NF violation)
------------------------------------------------------------
ALTER TABLE "school_years" DROP COLUMN IF EXISTS "is_active";

------------------------------------------------------------
-- 2. Add OSCYA and ALS to learner_type enum
------------------------------------------------------------
ALTER TYPE "learner_type" ADD VALUE IF NOT EXISTS 'OSCYA';
ALTER TYPE "learner_type" ADD VALUE IF NOT EXISTS 'ALS';

------------------------------------------------------------
-- 3. Remove EXAM_SCHEDULED from application_status enum
--    PostgreSQL cannot drop enum values, so we use a type-swap strategy.
------------------------------------------------------------

-- 3a. Migrate any rows still using the deprecated value
UPDATE "applicants"
SET "status" = 'ASSESSMENT_SCHEDULED'
WHERE "status" = 'EXAM_SCHEDULED';

-- 3b. Create new enum without EXAM_SCHEDULED
CREATE TYPE "application_status_new" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'FOR_REVISION',
  'ELIGIBLE',
  'ASSESSMENT_SCHEDULED',
  'ASSESSMENT_TAKEN',
  'PASSED',
  'PRE_REGISTERED',
  'TEMPORARILY_ENROLLED',
  'NOT_QUALIFIED',
  'ENROLLED',
  'REJECTED',
  'WITHDRAWN'
);

-- 3c. Alter the column to use the new enum
ALTER TABLE "applicants"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "application_status_new"
    USING ("status"::text::"application_status_new"),
  ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- 3d. Drop old enum and rename new one
DROP TYPE "application_status";
ALTER TYPE "application_status_new" RENAME TO "application_status";

------------------------------------------------------------
-- 4. Remove INTERVIEW_SCHEDULED from email_trigger enum
------------------------------------------------------------

-- 4a. Migrate any rows still using the deprecated value
UPDATE "email_logs"
SET "trigger" = 'EXAM_SCHEDULED'
WHERE "trigger" = 'INTERVIEW_SCHEDULED';

-- 4b. Create new enum without INTERVIEW_SCHEDULED
CREATE TYPE "email_trigger_new" AS ENUM (
  'APPLICATION_SUBMITTED',
  'APPLICATION_APPROVED',
  'APPLICATION_REJECTED',
  'EXAM_SCHEDULED',
  'ASSESSMENT_PASSED',
  'ASSESSMENT_FAILED'
);

-- 4c. Alter the column to use the new enum
ALTER TABLE "email_logs"
  ALTER COLUMN "trigger" TYPE "email_trigger_new"
    USING ("trigger"::text::"email_trigger_new");

-- 4d. Drop old enum and rename new one
DROP TYPE "email_trigger";
ALTER TYPE "email_trigger_new" RENAME TO "email_trigger";

------------------------------------------------------------
-- 5. Add missing indexes for common query patterns
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id"
  ON "audit_logs" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_documents_applicant_document_type"
  ON "documents" ("applicant_id", "document_type");

CREATE INDEX IF NOT EXISTS "idx_applicants_encoded_by_id"
  ON "applicants" ("encoded_by_id");

CREATE INDEX IF NOT EXISTS "idx_health_records_recorded_by_id"
  ON "health_records" ("recorded_by_id");
