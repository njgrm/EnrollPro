-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "clonedFromId" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "AcademicYearStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SchoolSettings" ADD COLUMN     "enrollmentCloseAt" TIMESTAMP(3),
ADD COLUMN     "enrollmentOpenAt" TIMESTAMP(3),
ADD COLUMN     "selectedAccentHsl" TEXT;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
