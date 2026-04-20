-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('REGISTRAR', 'SYSTEM_ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "compliance_status" AS ENUM ('PENDING', 'COMPLIED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "primary_contact_type" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'FOR_REVISION', 'ELIGIBLE', 'ASSESSMENT_SCHEDULED', 'ASSESSMENT_TAKEN', 'PASSED', 'INTERVIEW_SCHEDULED', 'PRE_REGISTERED', 'TEMPORARILY_ENROLLED', 'NOT_QUALIFIED', 'ENROLLED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "school_year_status" AS ENUM ('DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "applicant_type" AS ENUM ('REGULAR', 'SCIENCE_TECHNOLOGY_AND_ENGINEERING', 'SPECIAL_PROGRAM_IN_THE_ARTS', 'SPECIAL_PROGRAM_IN_SPORTS', 'SPECIAL_PROGRAM_IN_JOURNALISM', 'SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE', 'SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION');

-- CreateEnum
CREATE TYPE "email_trigger" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'EXAM_SCHEDULED', 'ASSESSMENT_PASSED', 'ASSESSMENT_FAILED');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "admission_channel" AS ENUM ('ONLINE', 'F2F');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED', 'MISSING');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PSA_BIRTH_CERTIFICATE', 'SECONDARY_BIRTH_PROOF', 'SF9_REPORT_CARD', 'SF10_PERMANENT_RECORD', 'GOOD_MORAL_CERTIFICATE', 'MEDICAL_CERTIFICATE', 'CERTIFICATE_OF_RECOGNITION', 'MEDICAL_EVALUATION', 'PEPT_AE_CERTIFICATE', 'PWD_ID', 'PSA_MARRIAGE_CERTIFICATE', 'UNDERTAKING', 'AFFIDAVIT_OF_UNDERTAKING', 'CONFIRMATION_SLIP', 'OTHERS');

-- CreateEnum
CREATE TYPE "learner_type" AS ENUM ('NEW_ENROLLEE', 'TRANSFEREE', 'RETURNING', 'CONTINUING', 'OSCYA', 'ALS');

-- CreateEnum
CREATE TYPE "assessment_period" AS ENUM ('BOSY', 'EOSY');

-- CreateEnum
CREATE TYPE "address_type" AS ENUM ('CURRENT', 'PERMANENT');

-- CreateEnum
CREATE TYPE "family_relationship" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "assessment_kind" AS ENUM ('INTERVIEW', 'QUALIFYING_EXAMINATION', 'PRELIMINARY_EXAMINATION', 'FINAL_EXAMINATION', 'GENERAL_ADMISSION_TEST', 'TALENT_AUDITION', 'PHYSICAL_FITNESS_TEST', 'SPORTS_SKILLS_TRYOUT', 'SKILLS_ASSESSMENT', 'STANDARDIZED_ADMISSION_TOOL', 'APTITUDE_TEST', 'INTEREST_INVENTORY');

-- CreateEnum
CREATE TYPE "scp_option_type" AS ENUM ('ART_FIELD', 'LANGUAGE', 'SPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "suffix" TEXT,
    "sex" "sex" NOT NULL DEFAULT 'FEMALE',
    "employee_id" TEXT,
    "designation" TEXT,
    "mobile_number" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "employee_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "email" TEXT,
    "contact_number" TEXT,
    "specialization" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

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
    "class_opening_date" DATE,
    "class_end_date" DATE,
    "early_reg_open_date" DATE,
    "early_reg_close_date" DATE,
    "enroll_open_date" DATE,
    "enroll_close_date" DATE,
    "is_manual_override_open" BOOLEAN NOT NULL DEFAULT false,
    "cloned_from_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL DEFAULT 40,
    "grade_level_id" INTEGER NOT NULL,
    "advising_teacher_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners" (
    "id" SERIAL NOT NULL,
    "lrn" VARCHAR(12),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "extension_name" TEXT,
    "birthdate" DATE NOT NULL,
    "sex" "sex" NOT NULL,
    "place_of_birth" TEXT,
    "religion" TEXT,
    "mother_tongue" TEXT,
    "is_ip_community" BOOLEAN NOT NULL DEFAULT false,
    "ip_group_name" TEXT,
    "is_learner_with_disability" BOOLEAN NOT NULL DEFAULT false,
    "disability_types" TEXT[],
    "is_4ps_beneficiary" BOOLEAN NOT NULL DEFAULT false,
    "household_id_4ps" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registration_applications" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "grade_level_id" INTEGER NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "applicant_type" "applicant_type" NOT NULL DEFAULT 'REGULAR',
    "learner_type" "learner_type" NOT NULL DEFAULT 'NEW_ENROLLEE',
    "status" "application_status" NOT NULL DEFAULT 'SUBMITTED',
    "channel" "admission_channel" NOT NULL DEFAULT 'ONLINE',
    "contact_number" TEXT NOT NULL,
    "email" TEXT,
    "primary_contact" "primary_contact_type",
    "is_privacy_consent_given" BOOLEAN NOT NULL,
    "encoded_by_id" INTEGER,
    "verified_at" TIMESTAMPTZ,
    "verified_by_id" INTEGER,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "early_registration_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registration_guardians" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "relationship" "family_relationship" NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "occupation" TEXT,

    CONSTRAINT "early_registration_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registration_documents" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "document_type" "document_type" NOT NULL,
    "status" "document_status" NOT NULL DEFAULT 'SUBMITTED',
    "file_name" TEXT,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "verification_note" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_registration_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registration_assessments" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "assessment_kind" "assessment_kind" NOT NULL,
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "venue" TEXT,
    "score" DOUBLE PRECISION,
    "result" TEXT,
    "notes" TEXT,
    "conducted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "early_registration_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_applications" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "early_registration_id" INTEGER,
    "school_year_id" INTEGER NOT NULL,
    "grade_level_id" INTEGER NOT NULL,
    "applicant_type" "applicant_type" NOT NULL DEFAULT 'REGULAR',
    "learner_type" "learner_type" NOT NULL DEFAULT 'NEW_ENROLLEE',
    "status" "application_status" NOT NULL DEFAULT 'SUBMITTED',
    "admission_channel" "admission_channel" NOT NULL DEFAULT 'ONLINE',
    "tracking_number" TEXT,
    "student_photo" TEXT,
    "is_balik_aral" BOOLEAN NOT NULL DEFAULT false,
    "last_year_enrolled" TEXT,
    "special_needs_category" TEXT,
    "has_pwd_id" BOOLEAN NOT NULL DEFAULT false,
    "learning_modalities" TEXT[],
    "is_temporarily_enrolled" BOOLEAN NOT NULL DEFAULT false,
    "documentary_deadline_at" DATE,
    "compliance_status" "compliance_status",
    "rejection_reason" TEXT,
    "is_privacy_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "portal_pin" TEXT,
    "portal_pin_changed_at" TIMESTAMPTZ,
    "encoded_by_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enrollment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_addresses" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "address_type" "address_type" NOT NULL,
    "house_no" TEXT,
    "street" TEXT,
    "sitio" TEXT,
    "barangay" TEXT,
    "city_municipality" TEXT,
    "province" TEXT,
    "country" TEXT DEFAULT 'PHILIPPINES',
    "zip_code" TEXT,

    CONSTRAINT "enrollment_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_family_members" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "relationship" "family_relationship" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "occupation" TEXT,

    CONSTRAINT "enrollment_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_previous_schools" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "school_name" TEXT,
    "school_deped_id" TEXT,
    "grade_completed" TEXT,
    "school_year_attended" TEXT,
    "school_address" TEXT,
    "school_type" TEXT,
    "nat_score" DOUBLE PRECISION,
    "general_average" DOUBLE PRECISION,

    CONSTRAINT "enrollment_previous_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_program_details" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "scp_type" "applicant_type" NOT NULL,
    "art_field" TEXT,
    "foreign_language" TEXT,
    "sports_list" TEXT[],

    CONSTRAINT "enrollment_program_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_documents" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "document_type" "document_type" NOT NULL,
    "status" "document_status" NOT NULL DEFAULT 'SUBMITTED',
    "file_name" TEXT,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "verification_note" TEXT,
    "is_presented_only" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" INTEGER,
    "verified_at" TIMESTAMPTZ,
    "verified_by_id" INTEGER,

    CONSTRAINT "enrollment_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_checklists" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "is_psa_birth_cert_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_original_psa_bc_collected" BOOLEAN NOT NULL DEFAULT false,
    "is_sf9_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_sf10_requested" BOOLEAN NOT NULL DEFAULT false,
    "is_good_moral_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_medical_eval_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_cert_of_recognition_presented" BOOLEAN NOT NULL DEFAULT false,
    "is_undertaking_signed" BOOLEAN NOT NULL DEFAULT false,
    "is_confirmation_slip_received" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "enrollment_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_records" (
    "id" SERIAL NOT NULL,
    "enrollment_application_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolled_by_id" INTEGER NOT NULL,

    CONSTRAINT "enrollment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "trigger" "email_trigger" NOT NULL,
    "status" "email_status" NOT NULL DEFAULT 'PENDING',
    "application_id" INTEGER,
    "error_message" TEXT,
    "attempted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" SERIAL NOT NULL,
    "learner_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "assessment_period" "assessment_period" NOT NULL,
    "assessment_date" DATE NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recorded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_program_configs" (
    "id" SERIAL NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "scp_type" "applicant_type" NOT NULL,
    "is_offered" BOOLEAN NOT NULL DEFAULT false,
    "is_two_phase" BOOLEAN NOT NULL DEFAULT false,
    "cutoff_score" DOUBLE PRECISION,
    "grade_requirements" JSONB,
    "ranking_formula" JSONB,
    "notes" TEXT,

    CONSTRAINT "scp_program_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_program_steps" (
    "id" SERIAL NOT NULL,
    "scp_program_config_id" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "assessment_kind" "assessment_kind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "venue" TEXT,
    "notes" TEXT,
    "cutoff_score" DOUBLE PRECISION,

    CONSTRAINT "scp_program_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scp_program_options" (
    "id" SERIAL NOT NULL,
    "scp_program_config_id" INTEGER NOT NULL,
    "option_type" "scp_option_type" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "scp_program_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_employee_id" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_teachers_employee_id" ON "teachers"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_school_years_year_label" ON "school_years"("year_label");

-- CreateIndex
CREATE INDEX "idx_grade_levels_school_year_id" ON "grade_levels"("school_year_id");

-- CreateIndex
CREATE INDEX "idx_sections_grade_level_id" ON "sections"("grade_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_learners_lrn" ON "learners"("lrn");

-- CreateIndex
CREATE INDEX "idx_learners_dedup" ON "learners"("last_name", "first_name", "birthdate");

-- CreateIndex
CREATE UNIQUE INDEX "uq_early_reg_tracking_number" ON "early_registration_applications"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_early_reg_sy_status" ON "early_registration_applications"("school_year_id", "status");

-- CreateIndex
CREATE INDEX "idx_early_reg_tracking_no" ON "early_registration_applications"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "early_registration_applications_learner_id_school_year_id_key" ON "early_registration_applications"("learner_id", "school_year_id");

-- CreateIndex
CREATE INDEX "idx_early_reg_guardians_app_id" ON "early_registration_guardians"("application_id");

-- CreateIndex
CREATE INDEX "idx_early_reg_docs_app_id" ON "early_registration_documents"("application_id");

-- CreateIndex
CREATE INDEX "idx_early_reg_assessments_app_id" ON "early_registration_assessments"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollment_tracking_number" ON "enrollment_applications"("tracking_number");

-- CreateIndex
CREATE INDEX "idx_enrollment_apps_status_sy" ON "enrollment_applications"("status", "school_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_addresses_application_id_address_type_key" ON "enrollment_addresses"("application_id", "address_type");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_family_members_application_id_relationship_key" ON "enrollment_family_members"("application_id", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollment_prev_school_app_id" ON "enrollment_previous_schools"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollment_prog_detail_app_id" ON "enrollment_program_details"("application_id");

-- CreateIndex
CREATE INDEX "idx_enrollment_docs_app_id" ON "enrollment_documents"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enrollment_checklist_app_id" ON "enrollment_checklists"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_enroll_record_app_id" ON "enrollment_records"("enrollment_application_id");

-- CreateIndex
CREATE INDEX "idx_enroll_records_section_id" ON "enrollment_records"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_departments_code" ON "departments"("code");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_type" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_status" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "idx_email_logs_trigger" ON "email_logs"("trigger");

-- CreateIndex
CREATE INDEX "idx_health_records_learner_id" ON "health_records"("learner_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_records_learner_id_school_year_id_assessment_period_key" ON "health_records"("learner_id", "school_year_id", "assessment_period");

-- CreateIndex
CREATE UNIQUE INDEX "scp_program_configs_school_year_id_scp_type_key" ON "scp_program_configs"("school_year_id", "scp_type");

-- CreateIndex
CREATE INDEX "idx_scp_program_steps_config_id" ON "scp_program_steps"("scp_program_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_program_steps_scp_program_config_id_step_order_key" ON "scp_program_steps"("scp_program_config_id", "step_order");

-- CreateIndex
CREATE INDEX "idx_scp_program_options_config_id" ON "scp_program_options"("scp_program_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_program_options_scp_program_config_id_option_type_value_key" ON "scp_program_options"("scp_program_config_id", "option_type", "value");

-- CreateIndex
CREATE INDEX "idx_teacher_subjects_teacher_id" ON "teacher_subjects"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_key" ON "teacher_subjects"("teacher_id", "subject");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_active_school_year_id_fkey" FOREIGN KEY ("active_school_year_id") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_cloned_from_id_fkey" FOREIGN KEY ("cloned_from_id") REFERENCES "school_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_advising_teacher_id_fkey" FOREIGN KEY ("advising_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_applications" ADD CONSTRAINT "early_registration_applications_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_applications" ADD CONSTRAINT "early_registration_applications_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_applications" ADD CONSTRAINT "early_registration_applications_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_applications" ADD CONSTRAINT "early_registration_applications_encoded_by_id_fkey" FOREIGN KEY ("encoded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_applications" ADD CONSTRAINT "early_registration_applications_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_guardians" ADD CONSTRAINT "early_registration_guardians_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "early_registration_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_documents" ADD CONSTRAINT "early_registration_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "early_registration_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registration_assessments" ADD CONSTRAINT "early_registration_assessments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "early_registration_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_early_registration_id_fkey" FOREIGN KEY ("early_registration_id") REFERENCES "early_registration_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_grade_level_id_fkey" FOREIGN KEY ("grade_level_id") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_encoded_by_id_fkey" FOREIGN KEY ("encoded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_addresses" ADD CONSTRAINT "enrollment_addresses_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_family_members" ADD CONSTRAINT "enrollment_family_members_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_previous_schools" ADD CONSTRAINT "enrollment_previous_schools_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_program_details" ADD CONSTRAINT "enrollment_program_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_documents" ADD CONSTRAINT "enrollment_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_documents" ADD CONSTRAINT "enrollment_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_documents" ADD CONSTRAINT "enrollment_documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_checklists" ADD CONSTRAINT "enrollment_checklists_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_checklists" ADD CONSTRAINT "enrollment_checklists_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_records" ADD CONSTRAINT "enrollment_records_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_records" ADD CONSTRAINT "enrollment_records_enrollment_application_id_fkey" FOREIGN KEY ("enrollment_application_id") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_records" ADD CONSTRAINT "enrollment_records_enrolled_by_id_fkey" FOREIGN KEY ("enrolled_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_records" ADD CONSTRAINT "enrollment_records_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "enrollment_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_program_configs" ADD CONSTRAINT "scp_program_configs_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_program_steps" ADD CONSTRAINT "scp_program_steps_scp_program_config_id_fkey" FOREIGN KEY ("scp_program_config_id") REFERENCES "scp_program_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_program_options" ADD CONSTRAINT "scp_program_options_scp_program_config_id_fkey" FOREIGN KEY ("scp_program_config_id") REFERENCES "scp_program_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
