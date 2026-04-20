-- Create reading profile enum used by enrollment applications
CREATE TYPE "reading_profile_level" AS ENUM (
  'INDEPENDENT',
  'INSTRUCTIONAL',
  'FRUSTRATION',
  'NON_READER'
);

-- Add reading profile fields required before section assignment/final enrollment
ALTER TABLE "enrollment_applications"
  ADD COLUMN "reading_profile_level" "reading_profile_level",
  ADD COLUMN "reading_profile_notes" TEXT,
  ADD COLUMN "reading_profile_assessed_at" TIMESTAMPTZ,
  ADD COLUMN "reading_profile_assessed_by_id" INTEGER;

ALTER TABLE "enrollment_applications"
  ADD CONSTRAINT "enrollment_applications_reading_profile_assessed_by_id_fkey"
  FOREIGN KEY ("reading_profile_assessed_by_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "idx_enrollment_apps_reading_profile_level"
  ON "enrollment_applications"("reading_profile_level");
