-- AlterTable
ALTER TABLE "teacher_designations"
ADD COLUMN "atlas_assign_teaching_load_all_grades" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "atlas_assign_teaching_load_grade_level_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "atlas_build_schedules_all_grades" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "atlas_build_schedules_grade_level_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
