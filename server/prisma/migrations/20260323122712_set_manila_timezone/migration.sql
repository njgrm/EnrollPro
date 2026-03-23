-- AlterTable
ALTER TABLE "applicants" ALTER COLUMN "exam_date" SET DATA TYPE DATE,
ALTER COLUMN "interview_date" SET DATA TYPE DATE,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "portal_pin_changed_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "uploaded_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "verified_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "email_logs" ALTER COLUMN "attempted_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "sent_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "enrollments" ALTER COLUMN "enrolled_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "grade_levels" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "health_records" ALTER COLUMN "assessment_date" SET DATA TYPE DATE,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "requirement_checklists" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "school_years" ALTER COLUMN "class_opening_date" SET DATA TYPE DATE,
ALTER COLUMN "class_end_date" SET DATA TYPE DATE,
ALTER COLUMN "early_reg_open_date" SET DATA TYPE DATE,
ALTER COLUMN "early_reg_close_date" SET DATA TYPE DATE,
ALTER COLUMN "enroll_open_date" SET DATA TYPE DATE,
ALTER COLUMN "enroll_close_date" SET DATA TYPE DATE,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "scp_configs" ALTER COLUMN "exam_date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "sections" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "strands" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "email" TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ;

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

-- CreateIndex
CREATE UNIQUE INDEX "uq_departments_code" ON "departments"("code");
