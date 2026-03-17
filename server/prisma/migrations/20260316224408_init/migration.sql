-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REGISTRAR', 'TEACHER', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'FOR_REVISION', 'ELIGIBLE', 'ASSESSMENT_SCHEDULED', 'ASSESSMENT_TAKEN', 'PRE_REGISTERED', 'NOT_QUALIFIED', 'ENROLLED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CurriculumType" AS ENUM ('OLD_STRAND', 'ELECTIVE_CLUSTER');

-- CreateEnum
CREATE TYPE "SHSTrack" AS ENUM ('ACADEMIC', 'TECHPRO');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('REGULAR', 'STE', 'SPA', 'SPS', 'SPJ', 'SPFL', 'SPTVE', 'STEM_GRADE11');

-- CreateEnum
CREATE TYPE "EmailTrigger" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'EXAM_SCHEDULED', 'ASSESSMENT_PASSED', 'ASSESSMENT_FAILED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSettings" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "logoPath" TEXT,
    "logoUrl" TEXT,
    "colorScheme" JSONB,
    "selectedAccentHsl" TEXT,
    "activeAcademicYearId" INTEGER,

    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "yearLabel" TEXT NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "classOpeningDate" TIMESTAMP(3),
    "classEndDate" TIMESTAMP(3),
    "earlyRegOpenDate" TIMESTAMP(3),
    "earlyRegCloseDate" TIMESTAMP(3),
    "enrollOpenDate" TIMESTAMP(3),
    "enrollCloseDate" TIMESTAMP(3),
    "manualOverrideOpen" BOOLEAN NOT NULL DEFAULT false,
    "clonedFromId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "applicableGradeLevelIds" INTEGER[],
    "academicYearId" INTEGER NOT NULL,
    "curriculumType" "CurriculumType" NOT NULL DEFAULT 'OLD_STRAND',
    "track" "SHSTrack",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Strand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 40,
    "gradeLevelId" INTEGER NOT NULL,
    "advisingTeacherId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" SERIAL NOT NULL,
    "lrn" VARCHAR(12),
    "psaBcNumber" TEXT,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "suffix" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "placeOfBirth" TEXT,
    "religion" TEXT,
    "motherTongue" TEXT,
    "currentAddress" JSONB NOT NULL,
    "permanentAddress" JSONB,
    "motherName" JSONB NOT NULL,
    "fatherName" JSONB NOT NULL,
    "guardianInfo" JSONB,
    "emailAddress" TEXT,
    "isIpCommunity" BOOLEAN NOT NULL DEFAULT false,
    "ipGroupName" TEXT,
    "is4PsBeneficiary" BOOLEAN NOT NULL DEFAULT false,
    "householdId4Ps" TEXT,
    "isBalikAral" BOOLEAN NOT NULL DEFAULT false,
    "lastYearEnrolled" TEXT,
    "isLearnerWithDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" TEXT[],
    "lastSchoolName" TEXT,
    "lastSchoolId" TEXT,
    "lastGradeCompleted" TEXT,
    "syLastAttended" TEXT,
    "lastSchoolAddress" TEXT,
    "lastSchoolType" TEXT,
    "learnerType" TEXT,
    "electiveCluster" TEXT,
    "scpApplication" BOOLEAN NOT NULL DEFAULT false,
    "scpType" TEXT,
    "spaArtField" TEXT,
    "spsSports" TEXT[],
    "spflLanguage" TEXT,
    "trackingNumber" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT,
    "gradeLevelId" INTEGER NOT NULL,
    "strandId" INTEGER,
    "academicYearId" INTEGER NOT NULL,
    "applicantType" "ApplicantType" NOT NULL DEFAULT 'REGULAR',
    "shsTrack" "SHSTrack",
    "examDate" TIMESTAMP(3),
    "examScore" DOUBLE PRECISION,
    "examResult" TEXT,
    "examNotes" TEXT,
    "assessmentType" TEXT,
    "interviewDate" TIMESTAMP(3),
    "interviewResult" TEXT,
    "natScore" DOUBLE PRECISION,
    "grade10ScienceGrade" DOUBLE PRECISION,
    "grade10MathGrade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledById" INTEGER NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectId" INTEGER,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "trigger" "EmailTrigger" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "applicantId" INTEGER,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScpConfig" (
    "id" SERIAL NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "scpType" "ApplicantType" NOT NULL,
    "isOffered" BOOLEAN NOT NULL DEFAULT false,
    "cutoffScore" DOUBLE PRECISION,
    "examDate" TIMESTAMP(3),
    "artFields" TEXT[],
    "languages" TEXT[],
    "sportsList" TEXT[],
    "notes" TEXT,

    CONSTRAINT "ScpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_yearLabel_key" ON "AcademicYear"("yearLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_trackingNumber_key" ON "Applicant"("trackingNumber");

-- CreateIndex
CREATE INDEX "Applicant_status_academicYearId_idx" ON "Applicant"("status", "academicYearId");

-- CreateIndex
CREATE INDEX "Applicant_lrn_idx" ON "Applicant"("lrn");

-- CreateIndex
CREATE INDEX "Applicant_applicantType_status_idx" ON "Applicant"("applicantType", "status");

-- CreateIndex
CREATE INDEX "Applicant_trackingNumber_idx" ON "Applicant"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_applicantId_key" ON "Enrollment"("applicantId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_trigger_idx" ON "EmailLog"("trigger");

-- CreateIndex
CREATE UNIQUE INDEX "ScpConfig_academicYearId_scpType_key" ON "ScpConfig"("academicYearId", "scpType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSettings" ADD CONSTRAINT "SchoolSettings_activeAcademicYearId_fkey" FOREIGN KEY ("activeAcademicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_clonedFromId_fkey" FOREIGN KEY ("clonedFromId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeLevel" ADD CONSTRAINT "GradeLevel_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strand" ADD CONSTRAINT "Strand_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_advisingTeacherId_fkey" FOREIGN KEY ("advisingTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScpConfig" ADD CONSTRAINT "ScpConfig_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
