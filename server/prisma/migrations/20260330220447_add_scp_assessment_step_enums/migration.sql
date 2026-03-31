-- AlterEnum: Add DepEd-specific SCP assessment types
ALTER TYPE "assessment_kind" ADD VALUE 'DOCUMENTARY_EVALUATION';
ALTER TYPE "assessment_kind" ADD VALUE 'QUALIFYING_EXAMINATION';
ALTER TYPE "assessment_kind" ADD VALUE 'GENERAL_ADMISSION_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'TALENT_AUDITION';
ALTER TYPE "assessment_kind" ADD VALUE 'PHYSICAL_FITNESS_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'SPORTS_SKILLS_TRYOUT';
ALTER TYPE "assessment_kind" ADD VALUE 'SKILLS_ASSESSMENT';
ALTER TYPE "assessment_kind" ADD VALUE 'STANDARDIZED_ADMISSION_TOOL';
ALTER TYPE "assessment_kind" ADD VALUE 'APTITUDE_TEST';
ALTER TYPE "assessment_kind" ADD VALUE 'INTEREST_INVENTORY';

-- AlterTable: Add step_order to assessments
ALTER TABLE "assessments" ADD COLUMN "step_order" INTEGER;

-- CreateTable: SCP assessment pipeline steps
CREATE TABLE "scp_assessment_steps" (
    "id" SERIAL NOT NULL,
    "scp_config_id" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "assessment_kind" "assessment_kind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "venue" TEXT,
    "notes" TEXT,

    CONSTRAINT "scp_assessment_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_scp_steps_config_id" ON "scp_assessment_steps"("scp_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_assessment_steps_scp_config_id_step_order_key" ON "scp_assessment_steps"("scp_config_id", "step_order");

-- AddForeignKey
ALTER TABLE "scp_assessment_steps" ADD CONSTRAINT "scp_assessment_steps_scp_config_id_fkey" FOREIGN KEY ("scp_config_id") REFERENCES "scp_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
