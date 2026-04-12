-- AlterEnum
ALTER TYPE "document_type" ADD VALUE 'CERTIFICATE_OF_RECOGNITION';

-- AlterTable
ALTER TABLE "applicant_checklists" ADD COLUMN     "is_cert_of_recognition_presented" BOOLEAN NOT NULL DEFAULT false;
