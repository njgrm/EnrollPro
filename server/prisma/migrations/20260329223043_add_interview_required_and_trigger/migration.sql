-- AlterEnum
ALTER TYPE "email_trigger" ADD VALUE 'INTERVIEW_SCHEDULED';

-- AlterTable
ALTER TABLE "scp_configs" ADD COLUMN     "interview_required" BOOLEAN NOT NULL DEFAULT false;
