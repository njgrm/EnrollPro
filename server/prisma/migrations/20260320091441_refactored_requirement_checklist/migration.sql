/*
  Warnings:

  - You are about to drop the column `is_other_doc_submitted` on the `requirement_checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_pept_ae_submitted` on the `requirement_checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_psa_bc_on_file` on the `requirement_checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_pwd_id_presented` on the `requirement_checklists` table. All the data in the column will be lost.
  - You are about to drop the column `is_secondary_birth_proof_submitted` on the `requirement_checklists` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "requirement_checklists" DROP COLUMN "is_other_doc_submitted",
DROP COLUMN "is_pept_ae_submitted",
DROP COLUMN "is_psa_bc_on_file",
DROP COLUMN "is_pwd_id_presented",
DROP COLUMN "is_secondary_birth_proof_submitted";
