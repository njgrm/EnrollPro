/*
  Warnings:

  - You are about to drop the column `art_field` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `assessment_type` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `audition_result` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `current_address` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_date` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_notes` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_result` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_score` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_time` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `exam_venue` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `father_name` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `foreign_language` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `general_average` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `grade10_math_grade` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `grade10_science_grade` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `guardian_info` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `interview_date` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `interview_notes` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `interview_result` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `is_scp_application` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `last_grade_completed` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `last_school_address` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `last_school_id` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `last_school_name` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `last_school_type` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `mother_name` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `nat_score` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_address` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `school_year_last_attended` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `scp_type` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `sports_list` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `tryout_result` on the `applicants` table. All the data in the column will be lost.
  - You are about to drop the column `art_fields` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `sports_list` on the `scp_configs` table. All the data in the column will be lost.
  - You are about to drop the column `applicable_grade_level_ids` on the `strands` table. All the data in the column will be lost.
  - You are about to drop the column `subjects` on the `teachers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "address_type" AS ENUM ('CURRENT', 'PERMANENT');

-- CreateEnum
CREATE TYPE "family_relationship" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "assessment_kind" AS ENUM ('WRITTEN_EXAM', 'INTERVIEW', 'AUDITION', 'TRYOUT');

-- CreateEnum
CREATE TYPE "scp_option_type" AS ENUM ('ART_FIELD', 'LANGUAGE', 'SPORT');

-- AlterTable
ALTER TABLE "applicants" DROP COLUMN "art_field",
DROP COLUMN "assessment_type",
DROP COLUMN "audition_result",
DROP COLUMN "current_address",
DROP COLUMN "exam_date",
DROP COLUMN "exam_notes",
DROP COLUMN "exam_result",
DROP COLUMN "exam_score",
DROP COLUMN "exam_time",
DROP COLUMN "exam_venue",
DROP COLUMN "father_name",
DROP COLUMN "foreign_language",
DROP COLUMN "general_average",
DROP COLUMN "grade10_math_grade",
DROP COLUMN "grade10_science_grade",
DROP COLUMN "guardian_info",
DROP COLUMN "interview_date",
DROP COLUMN "interview_notes",
DROP COLUMN "interview_result",
DROP COLUMN "is_scp_application",
DROP COLUMN "last_grade_completed",
DROP COLUMN "last_school_address",
DROP COLUMN "last_school_id",
DROP COLUMN "last_school_name",
DROP COLUMN "last_school_type",
DROP COLUMN "mother_name",
DROP COLUMN "nat_score",
DROP COLUMN "permanent_address",
DROP COLUMN "school_year_last_attended",
DROP COLUMN "scp_type",
DROP COLUMN "sports_list",
DROP COLUMN "tryout_result";

-- AlterTable
ALTER TABLE "scp_configs" DROP COLUMN "art_fields",
DROP COLUMN "languages",
DROP COLUMN "sports_list";

-- AlterTable
ALTER TABLE "strands" DROP COLUMN "applicable_grade_level_ids";

-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "subjects";

-- CreateTable
CREATE TABLE "applicant_addresses" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "address_type" "address_type" NOT NULL,
    "house_no" TEXT,
    "street" TEXT,
    "barangay" TEXT,
    "city_municipality" TEXT,
    "province" TEXT,
    "country" TEXT DEFAULT 'PHILIPPINES',
    "zip_code" TEXT,

    CONSTRAINT "applicant_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_family_members" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "relationship" "family_relationship" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "occupation" TEXT,

    CONSTRAINT "applicant_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previous_schools" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "school_name" TEXT,
    "school_deped_id" TEXT,
    "grade_completed" TEXT,
    "school_year_attended" TEXT,
    "school_address" TEXT,
    "school_type" TEXT,
    "nat_score" DOUBLE PRECISION,
    "grade10_science_grade" DOUBLE PRECISION,
    "grade10_math_grade" DOUBLE PRECISION,
    "general_average" DOUBLE PRECISION,

    CONSTRAINT "previous_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "assessment_kind" "assessment_kind" NOT NULL,
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "venue" TEXT,
    "score" DOUBLE PRECISION,
    "result" TEXT,
    "notes" TEXT,
    "conducted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_details" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "scp_type" "applicant_type" NOT NULL,
    "art_field" TEXT,
    "foreign_language" TEXT,
    "sports_list" TEXT[],

    CONSTRAINT "scp_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_config_options" (
    "id" SERIAL NOT NULL,
    "scp_config_id" INTEGER NOT NULL,
    "option_type" "scp_option_type" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "scp_config_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strand_grade_levels" (
    "strand_id" INTEGER NOT NULL,
    "grade_level_id" INTEGER NOT NULL,

    CONSTRAINT "strand_grade_levels_pkey" PRIMARY KEY ("strand_id","grade_level_id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_applicant_addresses_applicant_id" ON "applicant_addresses"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_addresses_applicant_id_address_type_key" ON "applicant_addresses"("applicant_id", "address_type");

-- CreateIndex
CREATE INDEX "idx_applicant_family_members_applicant_id" ON "applicant_family_members"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_family_members_applicant_id_relationship_key" ON "applicant_family_members"("applicant_id", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "uq_previous_schools_applicant_id" ON "previous_schools"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_assessments_applicant_id" ON "assessments"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_assessments_applicant_type" ON "assessments"("applicant_id", "assessment_kind");

-- CreateIndex
CREATE UNIQUE INDEX "uq_scp_details_applicant_id" ON "scp_details"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_scp_config_options_config_id" ON "scp_config_options"("scp_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_config_options_scp_config_id_option_type_value_key" ON "scp_config_options"("scp_config_id", "option_type", "value");

-- CreateIndex
CREATE INDEX "idx_teacher_subjects_teacher_id" ON "teacher_subjects"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_key" ON "teacher_subjects"("teacher_id", "subject");

-- AddForeignKey
ALTER TABLE "applicant_addresses" ADD CONSTRAINT "applicant_addresses_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_family_members" ADD CONSTRAINT "applicant_family_members_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previous_schools" ADD CONSTRAINT "previous_schools_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_details" ADD CONSTRAINT "scp_details_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_config_options" ADD CONSTRAINT "scp_config_options_scp_config_id_fkey" FOREIGN KEY ("scp_config_id") REFERENCES "scp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strand_grade_levels" ADD CONSTRAINT "strand_grade_levels_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "strands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strand_grade_levels" ADD CONSTRAINT "strand_grade_levels_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
