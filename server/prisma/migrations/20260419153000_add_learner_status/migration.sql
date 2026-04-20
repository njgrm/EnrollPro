-- Persist learner-level lifecycle status for online early-registration submission tracking.
ALTER TABLE "learners"
  ADD COLUMN "status" "application_status" NOT NULL DEFAULT 'SUBMITTED';

CREATE INDEX "idx_learners_status"
  ON "learners"("status");
