-- Remove Documentary Evaluation from SCP assessment pipeline
-- PostgreSQL cannot DROP a value from an existing enum, so we use a type-swap strategy.

-- Step 1: Clean up existing data that references DOCUMENTARY_EVALUATION
DELETE FROM "scp_assessment_steps" WHERE "assessment_kind" = 'DOCUMENTARY_EVALUATION';
DELETE FROM "assessments" WHERE "assessment_kind" = 'DOCUMENTARY_EVALUATION';

-- Step 2: Fix step_order for STE pipeline configs (decrement by 1 since step 1 was removed)
UPDATE "scp_assessment_steps"
SET "step_order" = "step_order" - 1
WHERE "scp_config_id" IN (
  SELECT sc."id" FROM "scp_configs" sc
  WHERE sc."scp_type" = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING'
)
AND "step_order" > 1;

-- Step 3: Create new enum type without DOCUMENTARY_EVALUATION
CREATE TYPE "assessment_kind_new" AS ENUM (
  'WRITTEN_EXAM',
  'INTERVIEW',
  'AUDITION',
  'TRYOUT',
  'QUALIFYING_EXAMINATION',
  'GENERAL_ADMISSION_TEST',
  'TALENT_AUDITION',
  'PHYSICAL_FITNESS_TEST',
  'SPORTS_SKILLS_TRYOUT',
  'SKILLS_ASSESSMENT',
  'STANDARDIZED_ADMISSION_TOOL',
  'APTITUDE_TEST',
  'INTEREST_INVENTORY'
);

-- Step 4: Alter columns to use the new enum type
ALTER TABLE "scp_assessment_steps"
  ALTER COLUMN "assessment_kind" TYPE "assessment_kind_new"
  USING ("assessment_kind"::text::"assessment_kind_new");

ALTER TABLE "assessments"
  ALTER COLUMN "assessment_kind" TYPE "assessment_kind_new"
  USING ("assessment_kind"::text::"assessment_kind_new");

-- Step 5: Drop the old enum and rename the new one
DROP TYPE "assessment_kind";
ALTER TYPE "assessment_kind_new" RENAME TO "assessment_kind";
