/*
  Warnings:

  - You are about to drop the column `scp_config_id` on the `scp_program_options` table. All the data in the column will be lost.
  - You are about to drop the column `scp_config_id` on the `scp_program_steps` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[scp_program_config_id,option_type,value]` on the table `scp_program_options` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scp_program_config_id,step_order]` on the table `scp_program_steps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scp_program_config_id` to the `scp_program_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scp_program_config_id` to the `scp_program_steps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "scp_program_options" DROP CONSTRAINT "scp_program_options_scp_config_id_fkey";

-- DropForeignKey
ALTER TABLE "scp_program_steps" DROP CONSTRAINT "scp_program_steps_scp_config_id_fkey";

-- DropIndex
DROP INDEX "idx_scp_program_options_config_id";

-- DropIndex
DROP INDEX "scp_program_options_scp_config_id_option_type_value_key";

-- DropIndex
DROP INDEX "idx_scp_program_steps_config_id";

-- DropIndex
DROP INDEX "scp_program_steps_scp_config_id_step_order_key";

-- AlterTable
ALTER TABLE "scp_program_options" DROP COLUMN "scp_config_id",
ADD COLUMN     "scp_program_config_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "scp_program_steps" DROP COLUMN "scp_config_id",
ADD COLUMN     "scp_program_config_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "idx_scp_program_options_config_id" ON "scp_program_options"("scp_program_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_program_options_scp_program_config_id_option_type_value_key" ON "scp_program_options"("scp_program_config_id", "option_type", "value");

-- CreateIndex
CREATE INDEX "idx_scp_program_steps_config_id" ON "scp_program_steps"("scp_program_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "scp_program_steps_scp_program_config_id_step_order_key" ON "scp_program_steps"("scp_program_config_id", "step_order");

-- AddForeignKey
ALTER TABLE "scp_program_steps" ADD CONSTRAINT "scp_program_steps_scp_program_config_id_fkey" FOREIGN KEY ("scp_program_config_id") REFERENCES "scp_program_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scp_program_options" ADD CONSTRAINT "scp_program_options_scp_program_config_id_fkey" FOREIGN KEY ("scp_program_config_id") REFERENCES "scp_program_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "health_records_applicant_id_idx" RENAME TO "idx_health_records_applicant_id";

-- RenameIndex
ALTER INDEX "health_records_applicant_id_school_year_id_idx" RENAME TO "idx_health_records_applicant_sy";
