/*
  Warnings:

  - A unique constraint covering the columns `[employee_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "employee_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_employee_id" ON "users"("employee_id");
