-- CreateEnum
CREATE TYPE "assessment_period" AS ENUM ('BOSY', 'EOSY');

-- AlterTable
ALTER TABLE "applicants" ADD COLUMN     "portal_pin" TEXT,
ADD COLUMN     "portal_pin_changed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "uploaded_by_id" INTEGER;

-- AlterTable
ALTER TABLE "requirement_checklists" ADD COLUMN     "updated_by_id" INTEGER;

-- CreateTable
CREATE TABLE "health_records" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "assessment_period" "assessment_period" NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recorded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_records_applicant_id_idx" ON "health_records"("applicant_id");

-- CreateIndex
CREATE INDEX "health_records_applicant_id_school_year_id_idx" ON "health_records"("applicant_id", "school_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_records_applicant_id_school_year_id_assessment_perio_key" ON "health_records"("applicant_id", "school_year_id", "assessment_period");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_checklists" ADD CONSTRAINT "requirement_checklists_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
