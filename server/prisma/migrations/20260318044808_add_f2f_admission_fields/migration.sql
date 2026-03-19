-- CreateEnum
CREATE TYPE "EarlyRegistrationChannel" AS ENUM ('ONLINE', 'F2F');

-- AlterTable
ALTER TABLE "Applicant" ADD COLUMN     "EarlyRegistrationChannel" "EarlyRegistrationChannel" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "encodedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_encodedById_fkey" FOREIGN KEY ("encodedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
