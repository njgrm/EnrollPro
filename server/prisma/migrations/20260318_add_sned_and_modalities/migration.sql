-- AlterTable: add snedCategory, hasPwdId, and learningModalities to Applicant
ALTER TABLE "Applicant"
  ADD COLUMN "snedCategory"       TEXT,
  ADD COLUMN "hasPwdId"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "learningModalities" TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[];
