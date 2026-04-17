import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("⚠️  Starting learner/application data wipe...");

  try {
    const [gradeLevelsBefore, schoolYearsBefore, sectionsBefore] =
      await Promise.all([
        prisma.gradeLevel.count(),
        prisma.schoolYear.count(),
        prisma.section.count(),
      ]);

    // 1. Clear records that reference EnrollmentApplication without DB-level cascade.
    const emailLogsResult = await prisma.emailLog.deleteMany({
      where: { applicationId: { not: null } },
    });
    console.log(
      `✅ Enrollment-linked email logs cleared (${emailLogsResult.count}).`,
    );

    // 2. Delete phase 2 applications first (required before deleting early registration apps).
    // Child records are removed via onDelete: Cascade in schema.prisma.
    const enrollmentAppsResult = await prisma.enrollmentApplication.deleteMany(
      {},
    );
    console.log(
      `✅ Enrollment applications cleared (${enrollmentAppsResult.count}).`,
    );

    // 3. Delete phase 1 applications and their dependent records.
    const earlyRegAppsResult =
      await prisma.earlyRegistrationApplication.deleteMany({});
    console.log(
      `✅ Early registration applications cleared (${earlyRegAppsResult.count}).`,
    );

    // 4. Clear health records, then learners.
    const healthRecordsResult = await prisma.healthRecord.deleteMany({});
    console.log(`✅ Health records cleared (${healthRecordsResult.count}).`);

    const learnersResult = await prisma.learner.deleteMany({});
    console.log(`✅ Learners cleared (${learnersResult.count}).`);

    const [gradeLevelsAfter, schoolYearsAfter, sectionsAfter] =
      await Promise.all([
        prisma.gradeLevel.count(),
        prisma.schoolYear.count(),
        prisma.section.count(),
      ]);

    if (
      gradeLevelsAfter !== gradeLevelsBefore ||
      schoolYearsAfter !== schoolYearsBefore ||
      sectionsAfter !== sectionsBefore
    ) {
      throw new Error(
        "Master data changed during wipe " +
          `(gradeLevels: ${gradeLevelsBefore} -> ${gradeLevelsAfter}, ` +
          `schoolYears: ${schoolYearsBefore} -> ${schoolYearsAfter}, ` +
          `sections: ${sectionsBefore} -> ${sectionsAfter}). ` +
          "Wipe aborted to protect baseline records.",
      );
    }

    console.log(`✅ GradeLevels preserved: ${gradeLevelsAfter}`);
    console.log(`✅ SchoolYears preserved: ${schoolYearsAfter}`);
    console.log(`✅ Sections preserved: ${sectionsAfter}`);

    console.log("\n✨ Learner/application data reset successful!");
    console.log(
      "   Preserved: Users, Teachers, SchoolYears, Sections, GradeLevels, SchoolSettings, and SCP configuration.",
    );
  } catch (error) {
    console.error("❌ Error during wipe:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
