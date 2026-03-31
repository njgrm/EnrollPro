/*
  Warnings:

  - You are about to drop the column `assessment_type` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `exam_date` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `exam_time` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `interview_required` on the `scp_configs` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "assessment_kind" ADD VALUE 'DOCUMENTARY_EVALUATION';
ALTER TYPE "assessment_kind" ADD VALUE 'QUALIFYING_EXAMINATION';
ALTER TYPE "assessment_kind" ADD VALUE 'GENERAL_ADMISSION_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'TALENT_AUDITION';
ALTER TYPE "assessment_kind" ADD VALUE 'PHYSICAL_FITNESS_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'SPORTS_SKILLS_TRYOUT';
ALTER TYPE "assessment_kind" ADD VALUE 'SKILLS_ASSESSMENT';
ALTER TYPE "assessment_kind" ADD VALUE 'STANDARDIZED_ADMISSION_TOOL';
ALTER TYPE "assessment_kind" ADD VALUE 'APTITUDE_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'INTEREST_INVENTORY';

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "step_order" INTEGER;

-- CreateTable
CREATE TABLE "scp_assessment_steps" (
    "id" SERIAL NOT NULL,
    "scp_config_id" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "assessment_kind" "assessment_kind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "venue" TEXT,
    "notes" TEXT,

    CONSTRAINT "scp_assessment_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_scp_steps_config_id" ON "scp_assessment_steps"("scp_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_assessment_steps_scp_config_id_step_order_key" ON "scp_assessment_steps"("scp_config_id", "step_order");

-- AddForeignKey
ALTER TABLE "scp_assessment_steps" ADD CONSTRAINT "scp_assessment_steps_scp_config_id_fkey" FOREIGN KEY ("scp_config_id") REFERENCES "scp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: Create default DepEd assessment pipeline steps for existing SCP configs
-- STE: Documentary Evaluation → Qualifying Examination → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'DOCUMENTARY_EVALUATION', 'Documentary Evaluation', 'Initial screening of Grade 6 grades (Science, Math, English ≥ 85%; others ≥ 83%)', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'QUALIFYING_EXAMINATION', 'Qualifying Examination (ESM)', 'Written admission test: English, Science, Mathematics — 21st-century skills and critical thinking', true
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW', 'Interview', 'Face-to-face or virtual interview: interest, mental alertness, readiness for rigorous curriculum', true
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING';

-- SPA: General Admission Test → Talent Audition → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'GENERAL_ADMISSION_TEST', 'General Admission Test', 'Written exam covering general knowledge and aptitude', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'TALENT_AUDITION', 'Talent Audition / Performance', 'Live performance, on-the-spot drawing/portfolio, creative writing task, or audition per chosen art field', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW', 'Interview', 'Assess passion for the arts and commitment to the 4-year program', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS';

-- SPS: Physical Fitness Test → Sports Skills Tryout → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'PHYSICAL_FITNESS_TEST', 'Physical Fitness Test (PFT)', 'Battery of tests measuring agility, strength, and endurance', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'SPORTS_SKILLS_TRYOUT', 'Sports Skills Demonstration (Tryout)', 'Demonstrate proficiency in specific sport (e.g. Basketball, Swimming, Athletics)', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW', 'Interview', 'Assess discipline, sportsmanship, and parental support', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS';

-- SPJ: Qualifying Test → Skills Assessment → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'QUALIFYING_EXAMINATION', 'Qualifying Test', 'Written exam: English and Filipino proficiency, grammar, basic news writing', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'SKILLS_ASSESSMENT', 'Skills Assessment (Writing Trials)', 'On-the-spot writing: news lead, editorial, or feature story', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW', 'Interview', 'Screening committee: communication skills and ethical awareness', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM';

-- SPFL: Standardized Admission Tool → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'STANDARDIZED_ADMISSION_TOOL', 'Standardized Admission Tool', 'Written test assessing linguistic aptitude and readiness for foreign language acquisition', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'INTERVIEW', 'Interview (with Parent/Guardian)', 'Validate documents and gauge commitment to the extra hours required', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE';

-- SPTVE: Aptitude Test → Interest Inventory/Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'APTITUDE_TEST', 'Aptitude Test', 'Written exam: inclination towards IT, Agriculture, Home Economics, or Industrial Arts', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION';

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'INTEREST_INVENTORY', 'Interest Inventory / Interview', 'Align student interests with specific shop offerings (specializations)', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION';

-- Backfill step_order on existing Assessment records (best-effort mapping)
UPDATE "assessments" SET "step_order" = 1 WHERE "assessment_kind" = 'WRITTEN_EXAM' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 2 WHERE "assessment_kind" = 'AUDITION' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 2 WHERE "assessment_kind" = 'TRYOUT' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 3 WHERE "assessment_kind" = 'INTERVIEW' AND "step_order" IS NULL;

-- Now drop old columns from scp_configs
ALTER TABLE "scp_configs" DROP COLUMN "assessment_type",
DROP COLUMN "exam_date",
DROP COLUMN "exam_time",
DROP COLUMN "interview_required";
