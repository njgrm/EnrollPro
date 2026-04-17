import "dotenv/config";
import { PrismaClient, ApplicantType } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import {
  SCP_DEFAULT_PIPELINES,
  getSteSteps,
  type ScpType,
} from "@enrollpro/shared";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCP_TYPES: ApplicantType[] = [
  "SCIENCE_TECHNOLOGY_AND_ENGINEERING",
  "SPECIAL_PROGRAM_IN_THE_ARTS",
  "SPECIAL_PROGRAM_IN_SPORTS",
  "SPECIAL_PROGRAM_IN_JOURNALISM",
  "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE",
  "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION",
];

const PROGRAM_PREFIX: Record<ApplicantType, string> = {
  REGULAR: "REG",
  SCIENCE_TECHNOLOGY_AND_ENGINEERING: "STE",
  SPECIAL_PROGRAM_IN_THE_ARTS: "SPA",
  SPECIAL_PROGRAM_IN_SPORTS: "SPS",
  SPECIAL_PROGRAM_IN_JOURNALISM: "SPJ",
  SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE: "SPFL",
  SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION: "SPTVE",
};

type ScpOptionSeed = {
  optionType: "ART_FIELD" | "LANGUAGE" | "SPORT";
  value: string;
};

const DEFAULT_SCP_OPTIONS: Partial<Record<ApplicantType, ScpOptionSeed[]>> = {
  SPECIAL_PROGRAM_IN_THE_ARTS: [
    { optionType: "ART_FIELD", value: "MUSIC" },
    { optionType: "ART_FIELD", value: "DANCE" },
    { optionType: "ART_FIELD", value: "VISUAL_ARTS" },
  ],
  SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE: [
    { optionType: "LANGUAGE", value: "MANDARIN" },
    { optionType: "LANGUAGE", value: "JAPANESE" },
  ],
  SPECIAL_PROGRAM_IN_SPORTS: [
    { optionType: "SPORT", value: "BASKETBALL" },
    { optionType: "SPORT", value: "VOLLEYBALL" },
    { optionType: "SPORT", value: "ATHLETICS" },
  ],
};

const PH_FIRST_NAMES = [
  "Juan",
  "Maria",
  "Jose",
  "Angelica",
  "Miguel",
  "Princess",
  "Carlo",
  "Jasmine",
  "Rafael",
  "Nicole",
  "Paolo",
  "Gabriela",
];

const PH_MIDDLE_NAMES = [
  "Santos",
  "Reyes",
  "Garcia",
  "Cruz",
  "Mendoza",
  "Aquino",
  "Flores",
  "Navarro",
  "Torres",
  "Bautista",
  "Castro",
  "Valdez",
];

const PH_LAST_NAMES = [
  "Dela Cruz",
  "Reyes",
  "Santos",
  "Garcia",
  "Mendoza",
  "Fernandez",
  "Navarro",
  "Ramos",
  "Bautista",
  "Gonzales",
  "Torres",
  "Villanueva",
];

function getPipelineForScpType(scpType: ApplicantType, isTwoPhase: boolean) {
  if (scpType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING") {
    return getSteSteps(isTwoPhase);
  }
  return SCP_DEFAULT_PIPELINES[scpType as ScpType] ?? [];
}

function buildTrackingNumber(
  scpType: ApplicantType,
  year: number,
  sequence: number,
) {
  return `${PROGRAM_PREFIX[scpType]}-${year}-${String(sequence).padStart(5, "0")}`;
}

function buildContactNumber(sequence: number) {
  const lastNineDigits = String(100000000 + sequence).slice(-9);
  return `09${lastNineDigits}`;
}

function buildEmail(firstName: string, lastName: string, sequence: number) {
  const safeFirst = firstName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const safeLast = lastName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${safeFirst}.${safeLast}${sequence}@example.com`;
}

async function seedScpConfigurations(schoolYearId: number) {
  for (const scpType of SCP_TYPES) {
    const config = await prisma.scpProgramConfig.upsert({
      where: {
        uq_scp_program_configs_type: {
          schoolYearId,
          scpType,
        },
      },
      update: {
        isOffered: true,
      },
      create: {
        schoolYearId,
        scpType,
        isOffered: true,
        isTwoPhase: false,
      },
    });

    const pipeline = getPipelineForScpType(scpType, config.isTwoPhase);

    await prisma.scpProgramStep.deleteMany({
      where: { scpProgramConfigId: config.id },
    });

    if (pipeline.length > 0) {
      await prisma.scpProgramStep.createMany({
        data: pipeline.map((step) => ({
          scpProgramConfigId: config.id,
          stepOrder: step.stepOrder,
          kind: step.kind,
          label: step.label,
          description: step.description,
          isRequired: step.isRequired,
        })),
      });
    }

    await prisma.scpProgramOption.deleteMany({
      where: { scpProgramConfigId: config.id },
    });

    const optionData = (DEFAULT_SCP_OPTIONS[scpType] ?? []).map((option) => ({
      scpProgramConfigId: config.id,
      optionType: option.optionType,
      value: option.value,
    }));

    if (optionData.length > 0) {
      await prisma.scpProgramOption.createMany({ data: optionData });
    }

    console.log(
      `Configured ${scpType}: ${pipeline.length} step(s), ${optionData.length} option(s).`,
    );
  }
}

async function seedScpApplications(
  schoolYearId: number,
  gradeLevelId: number,
  encodedById: number,
) {
  const year = new Date().getFullYear();
  let globalCounter = 1;

  for (const scpType of SCP_TYPES) {
    const config = await prisma.scpProgramConfig.findUnique({
      where: {
        uq_scp_program_configs_type: {
          schoolYearId,
          scpType,
        },
      },
      select: { isTwoPhase: true },
    });

    const pipeline = getPipelineForScpType(
      scpType,
      config?.isTwoPhase ?? false,
    );

    for (let i = 1; i <= 3; i++) {
      const seedNumber = globalCounter;
      const firstName =
        PH_FIRST_NAMES[(seedNumber - 1) % PH_FIRST_NAMES.length];
      const middleName =
        PH_MIDDLE_NAMES[(seedNumber - 1) % PH_MIDDLE_NAMES.length];
      const lastName = PH_LAST_NAMES[(seedNumber - 1) % PH_LAST_NAMES.length];
      const lrn = `190000${String(seedNumber).padStart(6, "0")}`;
      const sex = seedNumber % 2 === 0 ? "FEMALE" : "MALE";

      const birthMonth = (seedNumber % 12) + 1;
      const birthDay = ((seedNumber * 3) % 28) + 1;
      const birthdate = new Date(
        `2014-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      );

      const learner = await prisma.learner.upsert({
        where: { lrn },
        update: {
          firstName,
          middleName,
          lastName,
          birthdate,
          sex,
          disabilityTypes: [],
        },
        create: {
          lrn,
          firstName,
          middleName,
          lastName,
          birthdate,
          sex,
          disabilityTypes: [],
        },
      });

      const trackingNumber = buildTrackingNumber(scpType, year, seedNumber);
      const contactNumber = buildContactNumber(seedNumber);
      const email = buildEmail(firstName, lastName, seedNumber);

      const application = await prisma.earlyRegistrationApplication.upsert({
        where: { trackingNumber },
        update: {
          learnerId: learner.id,
          schoolYearId,
          gradeLevelId,
          applicantType: scpType,
          learnerType: "NEW_ENROLLEE",
          status: "SUBMITTED",
          channel: "F2F",
          contactNumber,
          email,
          guardianRelationship: "PARENT",
          hasNoMother: false,
          hasNoFather: false,
          isPrivacyConsentGiven: true,
          encodedById,
        },
        create: {
          learnerId: learner.id,
          schoolYearId,
          gradeLevelId,
          trackingNumber,
          applicantType: scpType,
          learnerType: "NEW_ENROLLEE",
          status: "SUBMITTED",
          channel: "F2F",
          contactNumber,
          email,
          guardianRelationship: "PARENT",
          hasNoMother: false,
          hasNoFather: false,
          isPrivacyConsentGiven: true,
          encodedById,
        },
      });

      await prisma.applicationChecklist.upsert({
        where: { earlyRegistrationId: application.id },
        update: {},
        create: { earlyRegistrationId: application.id },
      });

      await prisma.applicationFamilyMember.deleteMany({
        where: { earlyRegistrationId: application.id },
      });

      await prisma.applicationFamilyMember.createMany({
        data: [
          {
            earlyRegistrationId: application.id,
            relationship: "MOTHER",
            firstName: "Maria",
            lastName,
            middleName: null,
            contactNumber,
            email,
            occupation: "Teacher",
          },
          {
            earlyRegistrationId: application.id,
            relationship: "FATHER",
            firstName: "Jose",
            lastName,
            middleName: null,
            contactNumber,
            email: null,
            occupation: "Engineer",
          },
        ],
      });

      await prisma.applicationAddress.deleteMany({
        where: { earlyRegistrationId: application.id },
      });

      await prisma.applicationAddress.createMany({
        data: [
          {
            earlyRegistrationId: application.id,
            addressType: "CURRENT",
            houseNoStreet: `${100 + seedNumber}`,
            street: "Rizal Street",
            barangay: "Poblacion",
            cityMunicipality: "Tandag City",
            province: "Surigao del Sur",
            country: "PHILIPPINES",
            zipCode: "8300",
          },
          {
            earlyRegistrationId: application.id,
            addressType: "PERMANENT",
            houseNoStreet: `${100 + seedNumber}`,
            street: "Rizal Street",
            barangay: "Poblacion",
            cityMunicipality: "Tandag City",
            province: "Surigao del Sur",
            country: "PHILIPPINES",
            zipCode: "8300",
          },
        ],
      });

      await prisma.earlyRegistrationAssessment.deleteMany({
        where: { applicationId: application.id },
      });

      if (pipeline.length > 0) {
        await prisma.earlyRegistrationAssessment.createMany({
          data: pipeline.map((step) => ({
            applicationId: application.id,
            type: step.kind,
            scheduledDate: null,
            scheduledTime: null,
            venue: null,
            notes: `Seeded from default ${scpType} pipeline`,
          })),
        });
      }

      console.log(`Seeded SCP application ${trackingNumber} (${scpType}).`);
      globalCounter++;
    }
  }
}

async function seed() {
  try {
    const schoolYear = await prisma.schoolYear.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!schoolYear) {
      throw new Error(
        "No active school year found. Run db:seed first and ensure one school year is ACTIVE.",
      );
    }

    const grade7 = await prisma.gradeLevel.findFirst({
      where: {
        schoolYearId: schoolYear.id,
        OR: [{ name: "Grade 7" }, { displayOrder: 7 }],
      },
      orderBy: { id: "asc" },
    });

    if (!grade7) {
      throw new Error(
        'Grade level "Grade 7" (displayOrder 7) not found for the active school year.',
      );
    }

    const admin = await prisma.user.findFirst({
      where: { role: "SYSTEM_ADMIN" },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (!admin) {
      throw new Error("No SYSTEM_ADMIN user found. Run db:seed first.");
    }

    console.log(`Using School Year: ${schoolYear.yearLabel}`);
    await seedScpConfigurations(schoolYear.id);
    await seedScpApplications(schoolYear.id, grade7.id, admin.id);

    console.log("SCP seeding completed.");
  } catch (error) {
    console.error("ERROR during SCP seeding:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
