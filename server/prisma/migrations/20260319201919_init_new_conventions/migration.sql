-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('REGISTRAR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'FOR_REVISION', 'ELIGIBLE', 'ASSESSMENT_SCHEDULED', 'ASSESSMENT_TAKEN', 'PASSED', 'PRE_REGISTERED', 'TEMPORARILY_ENROLLED', 'NOT_QUALIFIED', 'ENROLLED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "school_year_status" AS ENUM ('DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "curriculum_type" AS ENUM ('OLD_STRAND', 'ELECTIVE_CLUSTER');

-- CreateEnum
CREATE TYPE "shs_track" AS ENUM ('ACADEMIC', 'TECHPRO');

-- CreateEnum
CREATE TYPE "applicant_type" AS ENUM ('REGULAR', 'STE', 'SPA', 'SPS', 'SPJ', 'SPFL', 'SPTVE', 'STEM_GRADE11');

-- CreateEnum
CREATE TYPE "email_trigger" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'EXAM_SCHEDULED', 'ASSESSMENT_PASSED', 'ASSESSMENT_FAILED');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "admission_channel" AS ENUM ('ONLINE', 'F2F');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED', 'MISSING');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PSA_BIRTH_CERTIFICATE', 'SECONDARY_BIRTH_PROOF', 'SF9_REPORT_CARD', 'SF10_PERMANENT_RECORD', 'GOOD_MORAL_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'MEDICAL_EVALUATION', 'PEPT_AE_CERTIFICATE', 'PWD_ID', 'PSA_MARRIAGE_CERTIFICATE', 'UNDERTAKING', 'AFFIDAVIT_OF_UNDERTAKING', 'CONFIRMATION_SLIP', 'OTHERS');

-- CreateEnum
CREATE TYPE "learner_type" AS ENUM ('NEW_ENROLLEE', 'TRANSFEREE', 'RETURNING', 'CONTINUING');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "employee_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "contact_number" TEXT,
    "specialization" TEXT,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" SERIAL NOT NULL,
    "school_name" TEXT NOT NULL,
    "logo_path" TEXT,
    "logo_url" TEXT,
    "color_scheme" JSONB,
    "selected_accent_hsl" TEXT,
    "active_school_year_id" INTEGER,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_years" (
    "id" SERIAL NOT NULL,
    "year_label" TEXT NOT NULL,
    "status" "school_year_status" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "class_opening_date" TIMESTAMP(3),
    "class_end_date" TIMESTAMP(3),
    "early_reg_open_date" TIMESTAMP(3),
    "early_reg_close_date" TIMESTAMP(3),
    "enroll_open_date" TIMESTAMP(3),
    "enroll_close_date" TIMESTAMP(3),
    "is_manual_override_open" BOOLEAN NOT NULL DEFAULT false,
    "cloned_from_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "applicable_grade_level_ids" INTEGER[],
    "school_year_id" INTEGER NOT NULL,
    "curriculum_type" "curriculum_type" NOT NULL DEFAULT 'OLD_STRAND',
    "track" "shs_track",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL DEFAULT 40,
    "grade_level_id" INTEGER NOT NULL,
    "advising_teacher_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" SERIAL NOT NULL,
    "lrn" VARCHAR(12),
    "psa_birth_cert_number" TEXT,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "suffix" TEXT,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "sex" "sex" NOT NULL,
    "place_of_birth" TEXT,
    "religion" TEXT,
    "mother_tongue" TEXT,
    "current_address" JSONB NOT NULL,
    "permanent_address" JSONB,
    "mother_name" JSONB NOT NULL,
    "father_name" JSONB NOT NULL,
    "guardian_info" JSONB,
    "email_address" TEXT,
    "is_ip_community" BOOLEAN NOT NULL DEFAULT false,
    "ip_group_name" TEXT,
    "is_4ps_beneficiary" BOOLEAN NOT NULL DEFAULT false,
    "household_id_4ps" TEXT,
    "is_balik_aral" BOOLEAN NOT NULL DEFAULT false,
    "last_year_enrolled" TEXT,
    "is_learner_with_disability" BOOLEAN NOT NULL DEFAULT false,
    "disability_types" TEXT[],
    "last_school_name" TEXT,
    "last_school_id" TEXT,
    "last_grade_completed" TEXT,
    "school_year_last_attended" TEXT,
    "last_school_address" TEXT,
    "last_school_type" TEXT,
    "learner_type" "learner_type" NOT NULL DEFAULT 'NEW_ENROLLEE',
    "elective_cluster" TEXT,
    "is_scp_application" BOOLEAN NOT NULL DEFAULT false,
    "scp_type" TEXT,
    "art_field" TEXT,
    "sports_list" TEXT[],
    "foreign_language" TEXT,
    "tracking_number" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'SUBMITTED',
    "rejection_reason" TEXT,
    "grade_level_id" INTEGER NOT NULL,
    "strand_id" INTEGER,
    "school_year_id" INTEGER NOT NULL,
    "applicant_type" "applicant_type" NOT NULL DEFAULT 'REGULAR',
    "shs_track" "shs_track",
    "exam_date" TIMESTAMP(3),
    "exam_venue" TEXT,
    "exam_score" DOUBLE PRECISION,
    "exam_result" TEXT,
    "exam_notes" TEXT,
    "assessment_type" TEXT,
    "interview_date" TIMESTAMP(3),
    "interview_result" TEXT,
    "interview_notes" TEXT,
    "audition_result" TEXT,
    "tryout_result" TEXT,
    "nat_score" DOUBLE PRECISION,
    "grade10_science_grade" DOUBLE PRECISION,
    "grade10_math_grade" DOUBLE PRECISION,
    "general_average" DOUBLE PRECISION,
    "is_privacy_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "admission_channel" "admission_channel" NOT NULL DEFAULT 'ONLINE',
    "encoded_by_id" INTEGER,
    "special_needs_category" TEXT,
    "has_pwd_id" BOOLEAN NOT NULL DEFAULT false,
    "learning_modalities" TEXT[],
    "is_temporarily_enrolled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "document_type" "document_type" NOT NULL,
    "status" "document_status" NOT NULL DEFAULT 'SUBMITTED',
    "file_name" TEXT,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "verification_note" TEXT,
    "is_presented_only" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" INTEGER,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_checklists" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "is_psa_birth_cert_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_psa_bc_on_file" BOOLEAN NOT NULL DEFAULT false,
    "is_original_psa_bc_collected" BOOLEAN NOT NULL DEFAULT false,
    "is_secondary_birth_proof_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_sf9_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_sf10_requested" BOOLEAN NOT NULL DEFAULT false,
    "is_good_moral_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_pept_ae_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_pwd_id_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_medical_eval_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_undertaking_signed" BOOLEAN NOT NULL DEFAULT false,
    "is_confirmation_slip_received" BOOLEAN NOT NULL DEFAULT false,
    "is_other_doc_submitted" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirement_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolled_by_id" INTEGER NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject_type" TEXT,
    "record_id" INTEGER,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "trigger" "email_trigger" NOT NULL,
    "status" "email_status" NOT NULL DEFAULT 'PENDING',
    "applicant_id" INTEGER,
    "error_message" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_configs" (
    "id" SERIAL NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "scp_type" "applicant_type" NOT NULL,
    "is_offered" BOOLEAN NOT NULL DEFAULT false,
    "cutoff_score" DOUBLE PRECISION,
    "exam_date" TIMESTAMP(3),
    "art_fields" TEXT[],
    "languages" TEXT[],
    "sports_list" TEXT[],
    "notes" TEXT,

    CONSTRAINT "scp_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_teachers_employee_id" ON "teachers"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_years_year_label" ON "school_years"("year_label");

-- CreateIndex
CREATE UNIQUE INDEX "uq_applicants_tracking_number" ON "applicants"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_applicants_status_school_year_id" ON "applicants"("status", "school_year_id");

-- CreateIndex
CREATE INDEX "idx_applicants_lrn" ON "applicants"("lrn");

-- CreateIndex
CREATE INDEX "idx_applicants_type_status" ON "applicants"("applicant_type", "status");

-- CreateIndex
CREATE INDEX "idx_applicants_tracking_number" ON "applicants"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_documents_applicant_id" ON "documents"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_requirement_checklists_applicant_id" ON "requirement_checklists"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollments_applicant_id" ON "enrollments"("applicant_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_type" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_email_logs_status" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "idx_email_logs_trigger" ON "email_logs"("trigger");

-- CreateIndex
CREATE UNIQUE INDEX "scp_configs_school_year_id_scp_type_key" ON "scp_configs"("school_year_id", "scp_type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_active_school_year_id_fkey" FOREIGN KEY ("active_school_year_id") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_cloned_from_id_fkey" FOREIGN KEY ("cloned_from_id") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strands" ADD CONSTRAINT "strands_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_advising_teacher_id_fkey" FOREIGN KEY ("advising_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_encoded_by_id_fkey" FOREIGN KEY ("encoded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "strands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_checklists" ADD CONSTRAINT "requirement_checklists_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_enrolled_by_id_fkey" FOREIGN KEY ("enrolled_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_configs" ADD CONSTRAINT "scp_configs_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
