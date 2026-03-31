-- Step 1: Migrate existing assessment records from legacy kinds to DepEd equivalents
UPDATE "assessments" SET "assessment_kind" = 'QUALIFYING_EXAMINATION' WHERE "assessment_kind" = 'WRITTEN_EXAM';
UPDATE "assessments" SET "assessment_kind" = 'TALENT_AUDITION' WHERE "assessment_kind" = 'AUDITION';
UPDATE "assessments" SET "assessment_kind" = 'SPORTS_SKILLS_TRYOUT' WHERE "assessment_kind" = 'TRYOUT';

-- Step 2: Migrate SCP assessment step configs from legacy kinds
UPDATE "scp_assessment_steps" SET "assessment_kind" = 'QUALIFYING_EXAMINATION' WHERE "assessment_kind" = 'WRITTEN_EXAM';
UPDATE "scp_assessment_steps" SET "assessment_kind" = 'TALENT_AUDITION' WHERE "assessment_kind" = 'AUDITION';
UPDATE "scp_assessment_steps" SET "assessment_kind" = 'SPORTS_SKILLS_TRYOUT' WHERE "assessment_kind" = 'TRYOUT';

-- Step 3: Remove legacy enum values from assessment_kind
-- Create the new enum type without legacy values
CREATE TYPE "assessment_kind_new" AS ENUM (
  'INTERVIEW',
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

-- Alter columns to use the new enum via text cast
ALTER TABLE "assessments" ALTER COLUMN "assessment_kind" TYPE "assessment_kind_new" USING ("assessment_kind"::text::"assessment_kind_new");
ALTER TABLE "scp_assessment_steps" ALTER COLUMN "assessment_kind" TYPE "assessment_kind_new" USING ("assessment_kind"::text::"assessment_kind_new");

-- Drop old enum and rename new one
DROP TYPE "assessment_kind";
ALTER TYPE "assessment_kind_new" RENAME TO "assessment_kind";
