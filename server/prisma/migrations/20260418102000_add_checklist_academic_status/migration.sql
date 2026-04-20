CREATE TYPE "academic_status" AS ENUM ('PROMOTED', 'RETAINED');

ALTER TABLE "application_checklists"
ADD COLUMN "academic_status" "academic_status" NOT NULL DEFAULT 'PROMOTED';
