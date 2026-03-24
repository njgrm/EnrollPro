-- AlterTable
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN "middle_name" TEXT;
ALTER TABLE "users" ADD COLUMN "sex" "sex" NOT NULL DEFAULT 'FEMALE';
ALTER TABLE "users" ADD COLUMN "suffix" TEXT;

-- Move existing data
UPDATE "users" SET "first_name" = split_part("name", ' ', 1);
UPDATE "users" SET "last_name" = split_part("name", ' ', 2);
-- Handle case where last name is missing or there are multiple parts (simplistic for migration)
UPDATE "users" SET "last_name" = 'User' WHERE "last_name" IS NULL OR "last_name" = '';

-- Make columns required
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;

-- Drop old column
ALTER TABLE "users" DROP COLUMN "name";
