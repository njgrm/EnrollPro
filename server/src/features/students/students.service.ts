import { prisma } from "../../lib/prisma.js";
import type {
  ApplicantType,
  Prisma,
  ApplicationStatus,
} from "../../generated/prisma/index.js";

type StudentSortOrder = "asc" | "desc";

const PROGRAM_TYPES: ApplicantType[] = [
  "REGULAR",
  "SCIENCE_TECHNOLOGY_AND_ENGINEERING",
  "SPECIAL_PROGRAM_IN_THE_ARTS",
  "SPECIAL_PROGRAM_IN_SPORTS",
  "SPECIAL_PROGRAM_IN_JOURNALISM",
  "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE",
  "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION",
];

const DEFAULT_STATUS: ApplicationStatus = "ENROLLED";

const parsePositiveInt = (value: unknown): number | undefined => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeProgramType = (value: unknown): ApplicantType | undefined => {
  if (typeof value !== "string") return undefined;
  const upper = value.trim().toUpperCase() as ApplicantType;
  return PROGRAM_TYPES.includes(upper) ? upper : undefined;
};

const normalizeSortOrder = (value: unknown): Prisma.SortOrder =>
  String(value).toLowerCase() === "asc" ? "asc" : "desc";

const resolveStudentOrderBy = (
  sortBy: unknown,
  sortOrder: Prisma.SortOrder,
): Prisma.EnrollmentApplicationOrderByWithRelationInput[] => {
  const key = String(sortBy ?? "");

  switch (key) {
    case "lastName":
      return [{ learner: { lastName: sortOrder } }, { id: "asc" }];
    case "lrn":
      return [{ learner: { lrn: sortOrder } }, { id: "asc" }];
    case "gradeLevel":
      return [{ gradeLevel: { displayOrder: sortOrder } }, { id: "asc" }];
    case "section":
      return [
        { enrollmentRecord: { section: { name: sortOrder } } },
        { id: "asc" },
      ];
    case "dateEnrolled":
    case "enrolledAt":
      return [{ enrollmentRecord: { enrolledAt: sortOrder } }, { id: "asc" }];
    case "createdAt":
      return [{ createdAt: sortOrder }, { id: "asc" }];
    case "updatedAt":
      return [{ updatedAt: sortOrder }, { id: "asc" }];
    default:
      return [{ enrollmentRecord: { enrolledAt: "desc" } }, { id: "asc" }];
  }
};

export async function findStudents(query: {
  schoolYearId?: number | string;
  search?: string;
  gradeLevelId?: number | string;
  sectionId?: number | string;
  programType?: ApplicantType | string;
  status?: ApplicationStatus;
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: StudentSortOrder;
}) {
  const {
    schoolYearId,
    search,
    gradeLevelId,
    sectionId,
    programType,
    status,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;
  const resolvedSchoolYearId = parsePositiveInt(schoolYearId);
  if (!resolvedSchoolYearId) {
    throw new Error("schoolYearId is required");
  }

  const resolvedPage = parsePositiveInt(page) ?? 1;
  const resolvedLimit = Math.min(parsePositiveInt(limit) ?? 15, 100);
  const resolvedGradeLevelId = parsePositiveInt(gradeLevelId);
  const resolvedSectionId = parsePositiveInt(sectionId);
  const resolvedProgramType = normalizeProgramType(programType);
  const resolvedSortOrder = normalizeSortOrder(sortOrder);
  const orderBy = resolveStudentOrderBy(sortBy, resolvedSortOrder);

  const skip = (resolvedPage - 1) * resolvedLimit;

  const where: Prisma.EnrollmentApplicationWhereInput = {
    schoolYearId: resolvedSchoolYearId,
    status: status || DEFAULT_STATUS,
  };

  if (search) {
    const s = String(search);
    where.OR = [
      { learner: { lrn: { contains: s, mode: "insensitive" } } },
      { learner: { firstName: { contains: s, mode: "insensitive" } } },
      { learner: { lastName: { contains: s, mode: "insensitive" } } },
      { trackingNumber: { contains: s, mode: "insensitive" } },
    ];
  }

  if (resolvedGradeLevelId) where.gradeLevelId = resolvedGradeLevelId;

  if (resolvedSectionId || resolvedProgramType) {
    where.enrollmentRecord = {
      ...(resolvedSectionId ? { sectionId: resolvedSectionId } : {}),
      ...(resolvedProgramType
        ? { section: { programType: resolvedProgramType } }
        : {}),
    };
  }

  const total = await prisma.enrollmentApplication.count({ where });
  const applications = await prisma.enrollmentApplication.findMany({
    where,
    include: {
      learner: true,
      gradeLevel: true,
      programDetail: {
        select: {
          scpType: true,
        },
      },
      enrollmentRecord: {
        include: {
          section: {
            select: {
              id: true,
              name: true,
              programType: true,
            },
          },
        },
      },
      addresses: true,
      familyMembers: true,
    },
    orderBy,
    skip,
    take: resolvedLimit,
  });

  return {
    applications,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  };
}

export async function getStudentsSummary(query: {
  schoolYearId?: number | string;
  status?: ApplicationStatus;
}) {
  const resolvedSchoolYearId = parsePositiveInt(query.schoolYearId);
  if (!resolvedSchoolYearId) {
    throw new Error("schoolYearId is required");
  }

  const applications = await prisma.enrollmentApplication.findMany({
    where: {
      schoolYearId: resolvedSchoolYearId,
      status: query.status || DEFAULT_STATUS,
    },
    select: {
      learner: {
        select: {
          sex: true,
        },
      },
      programDetail: {
        select: {
          scpType: true,
        },
      },
      enrollmentRecord: {
        select: {
          section: {
            select: {
              programType: true,
            },
          },
        },
      },
    },
  });

  const genderBreakdown = {
    male: 0,
    female: 0,
    other: 0,
  };

  const programBreakdown = PROGRAM_TYPES.reduce<Record<ApplicantType, number>>(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    {} as Record<ApplicantType, number>,
  );

  for (const application of applications) {
    const normalizedSex = String(application.learner?.sex ?? "")
      .trim()
      .toUpperCase();

    if (normalizedSex.startsWith("M")) {
      genderBreakdown.male += 1;
    } else if (normalizedSex.startsWith("F")) {
      genderBreakdown.female += 1;
    } else {
      genderBreakdown.other += 1;
    }

    const programType =
      application.enrollmentRecord?.section.programType ||
      application.programDetail?.scpType ||
      "REGULAR";

    programBreakdown[programType] += 1;
  }

  return {
    totalEnrolled: applications.length,
    genderBreakdown,
    programBreakdown,
  };
}
