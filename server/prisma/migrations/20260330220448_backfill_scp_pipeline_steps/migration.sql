-- Backfill: Create default DepEd assessment pipeline steps for existing SCP configs

-- STE: Documentary Evaluation → Qualifying Examination → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'DOCUMENTARY_EVALUATION'::"assessment_kind", 'Documentary Evaluation', 'Initial screening of Grade 6 grades (Science, Math, English ≥ 85%; others ≥ 83%)', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'QUALIFYING_EXAMINATION'::"assessment_kind", 'Qualifying Examination (ESM)', 'Written admission test: English, Science, Mathematics — 21st-century skills and critical thinking', true
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW'::"assessment_kind", 'Interview', 'Face-to-face or virtual interview: interest, mental alertness, readiness for rigorous curriculum', true
FROM scp_configs c WHERE c.scp_type = 'SCIENCE_TECHNOLOGY_AND_ENGINEERING' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 3);

-- SPA: General Admission Test → Talent Audition → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'GENERAL_ADMISSION_TEST'::"assessment_kind", 'General Admission Test', 'Written exam covering general knowledge and aptitude', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'TALENT_AUDITION'::"assessment_kind", 'Talent Audition / Performance', 'Live performance, on-the-spot drawing/portfolio, creative writing task, or audition per chosen art field', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW'::"assessment_kind", 'Interview', 'Assess passion for the arts and commitment to the 4-year program', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_THE_ARTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 3);

-- SPS: Physical Fitness Test → Sports Skills Tryout → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'PHYSICAL_FITNESS_TEST'::"assessment_kind", 'Physical Fitness Test (PFT)', 'Battery of tests measuring agility, strength, and endurance', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'SPORTS_SKILLS_TRYOUT'::"assessment_kind", 'Sports Skills Demonstration (Tryout)', 'Demonstrate proficiency in specific sport (e.g. Basketball, Swimming, Athletics)', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW'::"assessment_kind", 'Interview', 'Assess discipline, sportsmanship, and parental support', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_SPORTS' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 3);

-- SPJ: Qualifying Test → Skills Assessment → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'QUALIFYING_EXAMINATION'::"assessment_kind", 'Qualifying Test', 'Written exam: English and Filipino proficiency, grammar, basic news writing', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'SKILLS_ASSESSMENT'::"assessment_kind", 'Skills Assessment (Writing Trials)', 'On-the-spot writing: news lead, editorial, or feature story', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 3, 'INTERVIEW'::"assessment_kind", 'Interview', 'Screening committee: communication skills and ethical awareness', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_JOURNALISM' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 3);

-- SPFL: Standardized Admission Tool → Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'STANDARDIZED_ADMISSION_TOOL'::"assessment_kind", 'Standardized Admission Tool', 'Written test assessing linguistic aptitude and readiness for foreign language acquisition', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'INTERVIEW'::"assessment_kind", 'Interview (with Parent/Guardian)', 'Validate documents and gauge commitment to the extra hours required', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

-- SPTVE: Aptitude Test → Interest Inventory/Interview
INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required", "scheduled_date", "scheduled_time", "venue")
SELECT c.id, 1, 'APTITUDE_TEST'::"assessment_kind", 'Aptitude Test', 'Written exam: inclination towards IT, Agriculture, Home Economics, or Industrial Arts', true, c.exam_date, c.exam_time, c.venue
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id);

INSERT INTO "scp_assessment_steps" ("scp_config_id", "step_order", "assessment_kind", "label", "description", "is_required")
SELECT c.id, 2, 'INTEREST_INVENTORY'::"assessment_kind", 'Interest Inventory / Interview', 'Align student interests with specific shop offerings (specializations)', true
FROM scp_configs c WHERE c.scp_type = 'SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION' AND NOT EXISTS (SELECT 1 FROM scp_assessment_steps s WHERE s.scp_config_id = c.id AND s.step_order = 2);

-- Backfill step_order on existing Assessment records (best-effort mapping)
UPDATE "assessments" SET "step_order" = 1 WHERE "assessment_kind" = 'WRITTEN_EXAM' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 2 WHERE "assessment_kind" = 'AUDITION' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 2 WHERE "assessment_kind" = 'TRYOUT' AND "step_order" IS NULL;
UPDATE "assessments" SET "step_order" = 3 WHERE "assessment_kind" = 'INTERVIEW' AND "step_order" IS NULL;

-- Drop old columns from scp_configs (replaced by scp_assessment_steps)
ALTER TABLE "scp_configs" DROP COLUMN "assessment_type",
DROP COLUMN "exam_date",
DROP COLUMN "exam_time",
DROP COLUMN "interview_required";
