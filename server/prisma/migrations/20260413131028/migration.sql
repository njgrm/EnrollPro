-- CreateTable
CREATE TABLE "early_registrants" (
    "id" SERIAL NOT NULL,
    "lrn" VARCHAR(12),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "extension_name" TEXT,
    "birthdate" DATE NOT NULL,
    "sex" "sex" NOT NULL,
    "religion" TEXT,
    "is_ip_community" BOOLEAN NOT NULL DEFAULT false,
    "ip_group_name" TEXT,
    "is_learner_with_disability" BOOLEAN NOT NULL DEFAULT false,
    "disability_types" TEXT[],
    "house_no_street" TEXT,
    "sitio" TEXT,
    "barangay" TEXT NOT NULL,
    "city_municipality" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "early_registrants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registrant_guardians" (
    "id" SERIAL NOT NULL,
    "registrant_id" INTEGER NOT NULL,
    "relationship" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "contact_number" TEXT,
    "email" TEXT,

    CONSTRAINT "early_registrant_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "early_registrations" (
    "id" SERIAL NOT NULL,
    "registrant_id" INTEGER NOT NULL,
    "school_year_id" INTEGER NOT NULL,
    "grade_level" TEXT NOT NULL,
    "learner_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "channel" TEXT NOT NULL DEFAULT 'ONLINE',
    "contact_number" TEXT NOT NULL,
    "email" TEXT,
    "primary_contact" TEXT,
    "has_no_mother" BOOLEAN NOT NULL DEFAULT false,
    "has_no_father" BOOLEAN NOT NULL DEFAULT false,
    "is_privacy_consent_given" BOOLEAN NOT NULL,
    "applicant_id" INTEGER,
    "encoded_by_id" INTEGER,
    "verified_at" TIMESTAMPTZ,
    "verified_by_id" INTEGER,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "early_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_early_registrants_dedup" ON "early_registrants"("last_name", "first_name", "birthdate");

-- CreateIndex
CREATE UNIQUE INDEX "uq_early_registrants_lrn" ON "early_registrants"("lrn");

-- CreateIndex
CREATE INDEX "idx_early_registrant_guardians_registrant_id" ON "early_registrant_guardians"("registrant_id");

-- CreateIndex
CREATE INDEX "idx_early_registrations_sy_status" ON "early_registrations"("school_year_id", "status");

-- CreateIndex
CREATE INDEX "idx_early_registrations_applicant_id" ON "early_registrations"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "early_registrations_registrant_id_school_year_id_key" ON "early_registrations"("registrant_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "early_registrant_guardians" ADD CONSTRAINT "early_registrant_guardians_registrant_id_fkey" FOREIGN KEY ("registrant_id") REFERENCES "early_registrants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registrations" ADD CONSTRAINT "early_registrations_registrant_id_fkey" FOREIGN KEY ("registrant_id") REFERENCES "early_registrants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registrations" ADD CONSTRAINT "early_registrations_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registrations" ADD CONSTRAINT "early_registrations_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registrations" ADD CONSTRAINT "early_registrations_encoded_by_id_fkey" FOREIGN KEY ("encoded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "early_registrations" ADD CONSTRAINT "early_registrations_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
