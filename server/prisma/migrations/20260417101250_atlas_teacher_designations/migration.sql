-- CreateTable
CREATE TABLE "teacher_designations" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "is_class_adviser" BOOLEAN NOT NULL DEFAULT false,
    "advisory_equivalent_hours_per_week" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_tic" BOOLEAN NOT NULL DEFAULT false,
    "is_teaching_exempt" BOOLEAN NOT NULL DEFAULT false,
    "custom_target_teaching_hours_per_week" DOUBLE PRECISION,
    "designation_notes" TEXT,
    "effective_from" DATE,
    "effective_to" DATE,
    "update_reason" TEXT,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teacher_designations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_teacher_designations_school_year_id" ON "teacher_designations"("school_year_id");

-- CreateIndex
CREATE INDEX "idx_teacher_designations_updated_by_id" ON "teacher_designations"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_designations_teacher_id_school_year_id_key" ON "teacher_designations"("teacher_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "teacher_designations" ADD CONSTRAINT "teacher_designations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_designations" ADD CONSTRAINT "teacher_designations_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_designations" ADD CONSTRAINT "teacher_designations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
