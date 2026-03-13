/*
  Warnings:

  - The values [DRAFT,UPCOMING,ARCHIVED] on the enum `AcademicYearStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AcademicYearStatus_new" AS ENUM ('PLANNING', 'ENROLLMENT', 'ACTIVE', 'COMPLETED');
ALTER TABLE "public"."AcademicYear" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AcademicYear" ALTER COLUMN "status" TYPE "AcademicYearStatus_new" USING ("status"::text::"AcademicYearStatus_new");
ALTER TYPE "AcademicYearStatus" RENAME TO "AcademicYearStatus_old";
ALTER TYPE "AcademicYearStatus_new" RENAME TO "AcademicYearStatus";
DROP TYPE "public"."AcademicYearStatus_old";
ALTER TABLE "AcademicYear" ALTER COLUMN "status" SET DEFAULT 'PLANNING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'REVIEWING', 'QUALIFIED', 'ENROLLED', 'REJECTED');
ALTER TABLE "public"."Applicant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Applicant" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "Applicant" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "AcademicYear" ALTER COLUMN "status" SET DEFAULT 'PLANNING';
