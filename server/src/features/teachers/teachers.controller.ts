import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import path from "path";
import { unlink } from "fs/promises";
import { prisma } from "../../lib/prisma.js";
import { auditLog } from "../audit-logs/audit-logs.service.js";
import { SectionAdviserStatus, Role, Weekday, Prisma } from "../../generated/prisma/index.js";
import { broadcastRealtimeInvalidation } from "../../lib/sse.js";

// Helper functions for data normalization
function formatTeacherName(teacher: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
}): string {
  const middleInitial = teacher.middleName
    ? ` ${teacher.middleName.charAt(0)}.`
    : "";
  return `${teacher.lastName}, ${teacher.firstName}${middleInitial}`;
}

function normalizeOptionalUpperText(val: unknown): string | null {
  if (val === undefined || val === null || val === "" || val === "__NONE__")
    return null;
  return String(val).normalize("NFC").trim().toUpperCase();
}

interface PostgraduateDegreeInput {
  degree: string;
  major: string | null;
  minor: string | null;
}

function normalizePostgraduateDegrees(value: unknown): PostgraduateDegreeInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): PostgraduateDegreeInput[] => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const degree = normalizeOptionalUpperText(record.degree);
    if (!degree) return [];
    return [{
      degree,
      major: normalizeOptionalUpperText(record.major),
      minor: normalizeOptionalUpperText(record.minor),
    }];
  });
}

async function removeUploadedTeacherPhoto(photoPath: string | null): Promise<void> {
  if (!photoPath?.startsWith("/uploads/")) return;
  const filename = path.basename(photoPath);
  try {
    await unlink(path.resolve("uploads", filename));
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
    if (code !== "ENOENT") throw error;
  }
}

function normalizeAncillaryRoleFilter(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFC")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
  return normalized && normalized !== "ALL" ? normalized : null;
}

function normalizeOptionalText(val: unknown): string | null {
  if (val === undefined || val === null || val === "" || val === "__NONE__")
    return null;
  return String(val).normalize("NFC").trim();
}

function normalizeRequiredUpperText(val: unknown): string {
  if (val === undefined || val === null || val === "") return "";
  return String(val).normalize("NFC").trim().toUpperCase();
}

function normalizeRequiredLowerEmail(val: unknown): string {
  if (val === undefined || val === null || val === "") return "";
  return String(val).normalize("NFC").trim().toLowerCase();
}

function normalizeOptionalLowerEmail(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val).normalize("NFC").trim().toLowerCase();
}

function normalizeContactNumber(val: unknown): string | null {
  if (!val) return null;
  return String(val).replace(/\D/g, "").slice(0, 11);
}

function isValidContactNumber(val: unknown): boolean {
  if (!val) return true;
  const normalized = String(val).replace(/\D/g, "");
  return normalized.length === 11 || normalized.length === 0;
}

function parseDateOnly(val: unknown): Date | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

const TEMPORARY_APPOINTMENT_VALUES = new Set([
  "SUBSTITUTE",
  "CONTRACTUAL",
  "LOCAL_SCHOOL_BOARD",
]);

function isTemporaryAppointment(value: unknown): boolean {
  return typeof value === "string" && TEMPORARY_APPOINTMENT_VALUES.has(value);
}

function parseAccessExpirationDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const expiration = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(expiration.getTime()) ? null : expiration;
}

const WEEKDAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
};

function minutesFromTime(value: string): number {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  return hours * 60 + minutes;
}

function calculateScheduleMinutes(startTime: string, endTime: string): number {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  return Math.max(0, end - start);
}

interface SchedulePeriodShape {
  id: number;
  teacherId: number;
  schoolYearId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectLabel: string | null;
  sectionLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function formatSchedulePeriod(period: SchedulePeriodShape) {
  return {
    id: period.id,
    teacherId: period.teacherId,
    schoolYearId: period.schoolYearId,
    dayOfWeek: period.dayOfWeek,
    startTime: period.startTime,
    endTime: period.endTime,
    subjectLabel: period.subjectLabel,
    sectionLabel: period.sectionLabel,
    totalMinutes: calculateScheduleMinutes(period.startTime, period.endTime),
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };
}

function broadcastTeacherInvalidation({
  schoolYearId,
  teacherIds,
  sectionIds,
}: {
  schoolYearId?: number | null;
  teacherIds?: number[];
  sectionIds?: number[];
}): void {
  broadcastRealtimeInvalidation({
    topics: [
      "teachers:list",
      "teachers:detail",
      "homerooms:teachers",
      "homerooms:adviser-candidates",
      "homerooms:sections",
      "sectioning:sections",
      "dashboard:summary",
    ],
    schoolYearId,
    teacherIds,
    sectionIds,
  });
}

type TeacherIdentityConflictField = "employeeId" | "email";

function getTeacherIdentityConflictField(
  error: unknown,
): TeacherIdentityConflictField | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const prismaLikeError = error as {
    code?: unknown;
    meta?: {
      target?: unknown;
    };
  };

  if (prismaLikeError.code !== "P2002") {
    return null;
  }

  const rawTarget = prismaLikeError.meta?.target;
  const targetTokens: string[] = Array.isArray(rawTarget)
    ? rawTarget.filter((value): value is string => typeof value === "string")
    : typeof rawTarget === "string"
      ? [rawTarget]
      : [];

  if (
    targetTokens.some(
      (token) =>
        token.includes("employee_id") || token.includes("uq_teachers_employee"),
    )
  ) {
    return "employeeId";
  }

  if (
    targetTokens.some(
      (token) => token.includes("email") || token.includes("uq_teachers_email"),
    )
  ) {
    return "email";
  }

  return null;
}

export async function index(req: Request, res: Response) {
  try {
    const schoolYearId = req.query.schoolYearId
      ? parseInt(req.query.schoolYearId as string)
      : null;

    const ancillaryRole = normalizeAncillaryRoleFilter(req.query.ancillary_role);
    const personnelType = req.query.personnelType && req.query.personnelType !== "all"
      ? normalizeOptionalUpperText(req.query.personnelType)
      : null;
    const designation = req.query.designation && req.query.designation !== "all"
      ? String(req.query.designation).trim()
      : null;
    const department = req.query.department && req.query.department !== "all"
      ? String(req.query.department).trim()
      : null;
    const metric = typeof req.query.metric === "string" ? req.query.metric : "total";
    const search = typeof req.query.search === "string" && req.query.search.trim() !== ""
      ? req.query.search.trim()
      : null;
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "lastName";
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

    const pageParam = req.query.page ? parseInt(req.query.page as string) : null;
    const page = pageParam && !Number.isNaN(pageParam) ? Math.max(1, pageParam) : null;
    const limitParam = req.query.limit ? parseInt(req.query.limit as string) : null;
    const limit = limitParam && !Number.isNaN(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 50;

    const andConditions: Prisma.TeacherWhereInput[] = [];

    if (personnelType === "TEACHING") {
      andConditions.push({
        OR: [
          { personnelType: "TEACHING" },
          {
            personnelType: null,
            OR: [
              { plantillaPosition: { contains: "TEACHER", mode: "insensitive" } },
              { plantillaPosition: { contains: "INSTRUCTOR", mode: "insensitive" } },
              { plantillaPosition: { contains: "PRINCIPAL", mode: "insensitive" } },
              { plantillaPosition: { contains: "PROFESSOR", mode: "insensitive" } },
            ],
          },
        ],
      });
    } else if (personnelType === "NON_TEACHING") {
      andConditions.push({
        OR: [
          { personnelType: "NON_TEACHING" },
          {
            personnelType: null,
            NOT: {
              OR: [
                { plantillaPosition: { contains: "TEACHER", mode: "insensitive" } },
                { plantillaPosition: { contains: "INSTRUCTOR", mode: "insensitive" } },
                { plantillaPosition: { contains: "PRINCIPAL", mode: "insensitive" } },
                { plantillaPosition: { contains: "PROFESSOR", mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    if (department) {
      andConditions.push({
        departments: {
          some: {
            code: { equals: department, mode: "insensitive" },
          },
        },
      });
    }

    if (designation) {
      if (designation === "SUBJECT_TEACHER") {
        andConditions.push({
          OR: [
            { user: null },
            { user: { is: { roles: { isEmpty: true } } } },
          ],
        });
      } else {
        andConditions.push({
          user: {
            is: {
              roles: { has: designation as Role },
            },
          },
        });
      }
    }

    if (ancillaryRole) {
      const roleConditions: Prisma.TeacherWhereInput[] = [
        { ancillaryRoles: { has: ancillaryRole } },
        {
          teacherDesignations: {
            some: {
              ...(schoolYearId ? { schoolYearId } : {}),
              ancillaryRoles: { has: ancillaryRole },
            },
          },
        },
      ];

      if (ancillaryRole === "MRF COORDINATOR") {
        roleConditions.push({ user: { is: { roles: { has: Role.MRF } } } });
      }
      if (ancillaryRole === "SCHOOL REGISTRAR") {
        roleConditions.push({ user: { is: { roles: { has: Role.HEAD_REGISTRAR } } } });
      }

      andConditions.push({ OR: roleConditions });
    }

    const baseWhereWithoutMetric: Prisma.TeacherWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [totalCount, activeCount, inactiveCount, advisersCount] = await Promise.all([
      prisma.teacher.count({ where: baseWhereWithoutMetric }),
      prisma.teacher.count({ where: { AND: [...andConditions, { isActive: true }] } }),
      prisma.teacher.count({ where: { AND: [...andConditions, { isActive: false }] } }),
      prisma.teacher.count({
        where: {
          AND: [
            ...andConditions,
            {
              OR: [
                { user: { is: { roles: { has: Role.CLASS_ADVISER } } } },
                { teacherDesignations: { some: { isClassAdviser: true, ...(schoolYearId ? { schoolYearId } : {}) } } },
              ],
            },
          ],
        },
      }),
    ]);

    const finalAndConditions = [...andConditions];

    if (metric === "active") {
      finalAndConditions.push({ isActive: true });
    } else if (metric === "inactive") {
      finalAndConditions.push({ isActive: false });
    } else if (metric === "advisers") {
      finalAndConditions.push({
        OR: [
          { user: { is: { roles: { has: Role.CLASS_ADVISER } } } },
          { teacherDesignations: { some: { isClassAdviser: true, ...(schoolYearId ? { schoolYearId } : {}) } } },
        ],
      });
    }

    if (search) {
      finalAndConditions.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { middleName: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
          { contactNumber: { contains: search, mode: "insensitive" } },
          { specialization: { contains: search, mode: "insensitive" } },
          { departments: { some: { code: { contains: search, mode: "insensitive" } } } },
        ],
      });
    }

    const whereClause: Prisma.TeacherWhereInput =
      finalAndConditions.length > 0 ? { AND: finalAndConditions } : {};

    const filteredTotal = await prisma.teacher.count({ where: whereClause });

    const orderBy: Prisma.TeacherOrderByWithRelationInput[] = [
      { isActive: "desc" },
    ];
    if (sortBy === "plantillaPosition") {
      orderBy.push({ plantillaPosition: sortOrder }, { lastName: "asc" }, { firstName: "asc" });
    } else if (sortBy === "serviceStatus") {
      orderBy.push({ serviceStatus: sortOrder }, { lastName: "asc" }, { firstName: "asc" });
    } else {
      orderBy.push({ lastName: sortOrder }, { firstName: sortOrder });
    }

    const isPaginated = page !== null;
    const skip = isPaginated ? (page - 1) * limit : undefined;
    const take = isPaginated ? limit : undefined;

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      include: {
        departments: true,
        postgraduateDegrees: { orderBy: { sortOrder: "asc" } },
        user: {
          select: {
            id: true,
            isActive: true,
            lastLoginAt: true,
            mustChangePassword: true,
            roles: true,
            accessExpirationDate: true,
          },
        },
        teacherDesignations: {
          where: schoolYearId ? { schoolYearId } : { id: -1 },
          include: {
            advisorySection: {
              include: {
                gradeLevel: true,
              },
            },
          },
        },
      },
      orderBy,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });

    const formatted = teachers.map((teacher) => {
      const designation = teacher.teacherDesignations?.[0] ?? null;
      return {
        id: teacher.id,
        employeeId: teacher.employeeId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName,
        email: teacher.email,
        contactNumber: teacher.contactNumber,
        designationTitle: teacher.designation,
        specialization: teacher.specialization,
        undergraduateDegree: teacher.undergraduateDegree,
        bachelorMajor: teacher.bachelorMajor,
        bachelorMinor: teacher.bachelorMinor,
        postgraduateDegree: teacher.postgraduateDegree,
        majorSpecialization: teacher.majorSpecialization,
        minorSpecialization: teacher.minorSpecialization,
        postgraduateDegrees: teacher.postgraduateDegrees.map((entry) => ({
          id: entry.id,
          degree: entry.degree,
          major: entry.major,
          minor: entry.minor,
        })),
        indigenousCommunity: teacher.indigenousCommunity,
        natureOfAppointment: teacher.natureOfAppointment,
        fundingSource: teacher.fundingSource,
        departments: teacher.departments.map(d => d.code),
        plantillaPosition: teacher.plantillaPosition,
        photoPath: teacher.photoPath,
        sex: teacher.sex,
        birthdate: teacher.birthdate,
        personnelType: teacher.personnelType,
        functionalAssignment: teacher.functionalAssignment,
        ancillaryRoles: teacher.ancillaryRoles,
        subjects: [],
        isActive: teacher.isActive,
        serviceStatus: teacher.serviceStatus,
        createdAt: teacher.createdAt,
        userAccount: teacher.user
          ? {
            id: teacher.user.id,
            isActive: teacher.user.isActive,
            lastLoginAt: teacher.user.lastLoginAt
              ? teacher.user.lastLoginAt.toISOString()
              : null,
            mustChangePassword: teacher.user.mustChangePassword,
            roles: teacher.user.roles,
            accessExpirationDate: teacher.user.accessExpirationDate
              ? teacher.user.accessExpirationDate.toISOString()
              : null,
          }
          : null,
        designation: designation
          ? {
            id: designation.id,
            isClassAdviser: designation.isClassAdviser,
            advisorySectionId: designation.advisorySectionId,
            advisorySection: designation.advisorySection
              ? {
                id: designation.advisorySection.id,
                name: designation.advisorySection.name,
                gradeLevelId: designation.advisorySection.gradeLevelId,
                gradeLevelName: designation.advisorySection.gradeLevel.name,
              }
              : null,
            ancillaryRoles: designation.ancillaryRoles,
            atlasAssignTeachingLoad: designation.atlasAssignTeachingLoad,
            atlasAssignTeachingLoadAllGrades: designation.atlasAssignTeachingLoadAllGrades,
            atlasAssignTeachingLoadGradeLevelIds: designation.atlasAssignTeachingLoadGradeLevelIds,
            atlasBuildSchedules: designation.atlasBuildSchedules,
            atlasBuildSchedulesAllGrades: designation.atlasBuildSchedulesAllGrades,
            atlasBuildSchedulesGradeLevelIds: designation.atlasBuildSchedulesGradeLevelIds,
            effectiveFrom: designation.effectiveFrom,
            effectiveTo: designation.effectiveTo,
          }
          : null,
      };
    });

    let scopeData = null;
    if (schoolYearId) {
      const sy = await prisma.schoolYear.findUnique({
        where: { id: schoolYearId },
        select: {
          yearLabel: true,
          classOpeningDate: true,
          classEndDate: true,
        },
      });
      if (sy) {
        scopeData = {
          yearLabel: sy.yearLabel,
          classOpeningDate: sy.classOpeningDate,
          classEndDate: sy.classEndDate,
        };
      }
    }

    res.json({
      teachers: formatted,
      scope: scopeData,
      pagination: {
        page: page ?? 1,
        limit: isPaginated ? limit : formatted.length,
        total: filteredTotal,
        totalPages: isPaginated ? Math.ceil(filteredTotal / limit) : 1,
      },
      metrics: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        advisers: advisersCount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        suffix: true,
        email: true,
        mobileNumber: true,
        sex: true,
        designation: true,
        isActive: true,
        lastLoginAt: true,
        mustChangePassword: true,
        roles: true,
        accessExpirationDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId },
          ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
        ],
      },
      include: {
        departments: true,
        postgraduateDegrees: { orderBy: { sortOrder: "asc" } },
        schedulePeriods: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        advisoryHistory: {
          include: {
            section: {
              include: {
                gradeLevel: true,
              },
            },
            schoolYear: true,
          },
          orderBy: { effectiveFrom: "desc" },
        },
        teacherDesignations: {
          include: {
            advisorySection: {
              include: {
                gradeLevel: true,
              },
            },
            schoolYear: true,
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            email: true,
            roles: true,
            isActive: true,
            lastLoginAt: true,
            mustChangePassword: true,
            accessExpirationDate: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.json({
        teacher: {
          id: 0,
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          suffix: user.suffix,
          email: user.email,
          contactNumber: user.mobileNumber,
          sex: user.sex,
          designationTitle: user.designation,
          specialization: null,
          departments: [],
          plantillaPosition: user.designation,
          undergraduateDegree: null,
          bachelorMajor: null,
          bachelorMinor: null,
          postgraduateDegree: null,
          majorSpecialization: null,
          minorSpecialization: null,
          postgraduateDegrees: [],
          indigenousCommunity: null,
          natureOfAppointment: "REGULAR_PERMANENT",
          fundingSource: "NATIONAL",
          photoPath: null,
          birthdate: null,
          personnelType: "NON_TEACHING",
          functionalAssignment: user.designation,
          ancillaryRoles: [],
          atlasAssignTeachingLoad: false,
          atlasAssignTeachingLoadAllGrades: true,
          atlasAssignTeachingLoadGradeLevelIds: [],
          atlasBuildSchedules: false,
          atlasBuildSchedulesAllGrades: true,
          atlasBuildSchedulesGradeLevelIds: [],
          sectionCount: 0,
          designation: null,
          isActive: user.isActive,
          serviceStatus: "ACTIVE",
          createdAt: user.createdAt.toISOString(),
          schedulePeriods: [],
          advisoryHistory: [],
          teacherDesignations: [],
          userAccount: {
            id: user.id,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
            mustChangePassword: user.mustChangePassword,
            roles: user.roles,
            accessExpirationDate: user.accessExpirationDate?.toISOString() ?? null,
          },
        },
      });
    }

    const latestDesignation = teacher.teacherDesignations[0] || null;

    res.json({
      teacher: {
        ...teacher,
        userAccount: teacher.user,
        designationTitle: teacher.designation,
        designation: latestDesignation,
        subjects: [],
        departments: teacher.departments.map(d => d.code),
        serviceStatus: teacher.serviceStatus,
        ancillaryRoles: latestDesignation?.ancillaryRoles?.length ? latestDesignation.ancillaryRoles : teacher.ancillaryRoles,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function show(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);

  try {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(isNaN(id) ? [] : [{ id }]),
          { employeeId: idStr },
        ],
      },
      include: {
        departments: true,
        postgraduateDegrees: { orderBy: { sortOrder: "asc" } },
        schedulePeriods: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        advisoryHistory: {
          include: {
            section: {
              include: {
                gradeLevel: true,
              },
            },
            schoolYear: true,
          },
          orderBy: { effectiveFrom: "desc" },
        },
        teacherDesignations: {
          include: {
            advisorySection: {
              include: {
                gradeLevel: true,
              },
            },
            schoolYear: true,
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            email: true,
            roles: true,
            isActive: true,
            lastLoginAt: true,
            mustChangePassword: true,
            accessExpirationDate: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const userRoles = req.user?.roles || [];
    const isStaffAdmin = userRoles.includes("SYSTEM_ADMIN") || userRoles.includes("PRINCIPAL");
    let isSelf = Boolean(req.user?.userId && teacher.userId === req.user.userId);
    if (!isStaffAdmin && !isSelf && teacher.employeeId && req.user?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { employeeId: true },
      });
      if (user?.employeeId && user.employeeId === teacher.employeeId) {
        isSelf = true;
      }
    }

    if (!isStaffAdmin && !isSelf) {
      return res.status(403).json({ message: "Access denied to this personnel profile" });
    }

    const targetSyId = req.schoolYearId;
    const matchedDesignation = targetSyId
      ? teacher.teacherDesignations.find((d) => d.schoolYearId === targetSyId)
      : null;
    const latestDesignation = matchedDesignation || teacher.teacherDesignations[0] || null;

    res.json({
      teacher: {
        ...teacher,
        userAccount: teacher.user,
        designationTitle: teacher.designation,
        designation: latestDesignation,
        subjects: [],
        departments: teacher.departments.map(d => d.code),
        serviceStatus: teacher.serviceStatus,
        ancillaryRoles: latestDesignation?.ancillaryRoles?.length ? latestDesignation.ancillaryRoles : teacher.ancillaryRoles,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function store(req: Request, res: Response) {
  try {
    const {
      firstName,
      lastName,
      middleName,
      suffix,
      email,
      employeeId,
      contactNumber,
      sex,
      specialization,
      departments,
      plantillaPosition,
      birthdate,
      personnelType,
      functionalAssignment,
      undergraduateDegree,
      bachelorMajor,
      bachelorMinor,
      bachelor_degree: bachelorDegree,
      bachelor_major: snakeCaseBachelorMajor,
      bachelor_minor: snakeCaseBachelorMinor,
      postgraduateDegree,
      majorSpecialization,
      minorSpecialization,
      indigenousCommunity,
      natureOfAppointment,
      fundingSource,
      password,
      portalActive,
      accessExpirationDate,
      roles,
      serviceStatus,
      serviceEffectiveDate,
      serviceRemarks,
      ancillaryRoles,
      postgraduateDegrees,
      atlasAssignTeachingLoad,
      atlasAssignTeachingLoadAllGrades,
      atlasAssignTeachingLoadGradeLevelIds,
      atlasBuildSchedules,
      atlasBuildSchedulesAllGrades,
      atlasBuildSchedulesGradeLevelIds,
    } = req.body;

    const normalizedFirstName = normalizeRequiredUpperText(firstName);
    const normalizedLastName = normalizeRequiredUpperText(lastName);
    const normalizedEmployeeId = normalizeOptionalUpperText(employeeId);
    const normalizedEmail = normalizeOptionalLowerEmail(email);
    const normalizedContactNumber = normalizeContactNumber(contactNumber);
    const normalizedBachelorDegree = normalizeOptionalUpperText(undergraduateDegree ?? bachelorDegree);
    const normalizedBachelorMajor = normalizeOptionalUpperText(bachelorMajor ?? snakeCaseBachelorMajor);
    const normalizedBachelorMinor = normalizeOptionalUpperText(bachelorMinor ?? snakeCaseBachelorMinor);
    const isTemporary = isTemporaryAppointment(natureOfAppointment);
    const parsedAccessExpirationDate = isTemporary
      ? parseAccessExpirationDate(accessExpirationDate)
      : null;

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({
        message: "First name and last name are required",
      });
    }

    if (!isTemporary && !normalizedEmployeeId) {
      return res.status(400).json({
        message: "Employee ID is required for regular personnel",
      });
    }

    if (normalizedEmployeeId && !/^\d{7}$/.test(normalizedEmployeeId)) {
      return res.status(400).json({
        message: "Employee ID must be exactly 7 numeric digits",
      });
    }

    if (isTemporary && !parsedAccessExpirationDate) {
      return res.status(400).json({
        message: "Contract end date / access expiration is required for temporary personnel",
      });
    }

    if (!isValidContactNumber(normalizedContactNumber)) {
      return res
        .status(400)
        .json({ message: "Contact number must be exactly 11 digits" });
    }

    if (normalizedBachelorDegree && !normalizedBachelorMajor) {
      return res.status(422).json({
        message: "Bachelor degree major or specialization is required",
        errors: {
          bachelorMajor: ["Enter the bachelor degree major or specialization."],
        },
      });
    }

    const deptCodes = (Array.isArray(departments) ? departments.map(d => normalizeOptionalUpperText(d)).filter(Boolean) : []) as string[];
    const normalizedPostgraduateDegrees = normalizePostgraduateDegrees(postgraduateDegrees);
    const primaryPostgraduateDegree = normalizedPostgraduateDegrees[0] ?? null;

    const teacher = await prisma.$transaction(async (tx) => {
      const defaultPasswordHash = await bcrypt.hash(password || "DepEd2026!", 10);

      // 1. Create/Upsert the User record for system login
      const existingUser = normalizedEmployeeId
        ? await tx.user.findUnique({
          where: { employeeId: normalizedEmployeeId },
          select: { id: true, roles: true },
        })
        : null;

      if (existingUser && existingUser.roles.includes("SYSTEM_ADMIN")) {
        throw new Error(
          "Conflict: This employee ID is already assigned to a System Administrator and cannot be automatically converted to a Teacher account.",
        );
      }

      const userData = {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        middleName: normalizeOptionalUpperText(middleName),
        suffix: normalizeOptionalUpperText(suffix),
        email: normalizedEmail,
        employeeId: normalizedEmployeeId,
        sex: sex === "MALE" ? "MALE" as const : "FEMALE" as const,
        designation: "SUBJECT TEACHER",
        isActive: portalActive !== undefined
          ? portalActive
          : serviceStatus
            ? serviceStatus === "ACTIVE"
            : true,
        accessExpirationDate: parsedAccessExpirationDate,
      };

      const upsertedUser = existingUser
        ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            ...userData,
            ...(normalizedEmployeeId ? { accountName: normalizedEmployeeId } : {}),
            ...(roles && roles.length > 0 ? { roles } : {}),
          },
          select: { id: true },
        })
        : await tx.user.create({
          data: {
            ...userData,
            accountName: normalizedEmployeeId,
            password: defaultPasswordHash,
            roles: roles && roles.length > 0 ? roles : ["TEACHER"],
            mustChangePassword: true,
          },
          select: { id: true },
        });

      // 2. Create the Teacher profile linked to the User
      const t = await tx.teacher.create({
        data: {
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          middleName: normalizeOptionalUpperText(middleName),
          email: normalizedEmail,
          employeeId: normalizedEmployeeId,
          contactNumber: normalizedContactNumber,
          sex: sex === "MALE" ? "MALE" : "FEMALE",
          specialization: normalizeOptionalUpperText(specialization),
          departments: deptCodes.length > 0 ? { connect: deptCodes.map(code => ({ code })) } : undefined,
          plantillaPosition: normalizeOptionalUpperText(plantillaPosition),
          designation: "SUBJECT TEACHER",
          user: { connect: { id: upsertedUser.id } },
          birthdate: parseDateOnly(birthdate),
          personnelType: normalizeOptionalUpperText(personnelType),
          functionalAssignment: normalizeOptionalUpperText(functionalAssignment),
          undergraduateDegree: normalizedBachelorDegree,
          bachelorMajor: normalizedBachelorMajor,
          bachelorMinor: normalizedBachelorMinor,
          postgraduateDegree: primaryPostgraduateDegree?.degree ?? normalizeOptionalUpperText(postgraduateDegree),
          majorSpecialization: primaryPostgraduateDegree?.major ?? normalizeOptionalUpperText(majorSpecialization),
          minorSpecialization: primaryPostgraduateDegree?.minor ?? normalizeOptionalUpperText(minorSpecialization),
          postgraduateDegrees: normalizedPostgraduateDegrees.length > 0
            ? {
              create: normalizedPostgraduateDegrees.map((entry, sortOrder) => ({
                ...entry,
                sortOrder,
              })),
            }
            : undefined,
          indigenousCommunity: normalizeOptionalUpperText(indigenousCommunity),
          serviceEffectiveDate: parseDateOnly(serviceEffectiveDate),
          serviceRemarks: serviceRemarks || null,
          ...(natureOfAppointment ? { natureOfAppointment } : {}),
          ...(fundingSource ? { fundingSource } : {}),
          ...(serviceStatus ? { serviceStatus } : {}),
        },
      });

      if ((ancillaryRoles !== undefined || atlasAssignTeachingLoad !== undefined || atlasBuildSchedules !== undefined) && req.schoolYearId) {
        await tx.teacherDesignation.create({
          data: {
            teacherId: t.id,
            schoolYearId: req.schoolYearId,
            ancillaryRoles: Array.isArray(ancillaryRoles) ? ancillaryRoles : [],
            atlasAssignTeachingLoad: Boolean(atlasAssignTeachingLoad),
            atlasAssignTeachingLoadAllGrades: atlasAssignTeachingLoadAllGrades !== undefined ? Boolean(atlasAssignTeachingLoadAllGrades) : true,
            atlasAssignTeachingLoadGradeLevelIds: Array.isArray(atlasAssignTeachingLoadGradeLevelIds) ? atlasAssignTeachingLoadGradeLevelIds : [],
            atlasBuildSchedules: Boolean(atlasBuildSchedules),
            atlasBuildSchedulesAllGrades: atlasBuildSchedulesAllGrades !== undefined ? Boolean(atlasBuildSchedulesAllGrades) : true,
            atlasBuildSchedulesGradeLevelIds: Array.isArray(atlasBuildSchedulesGradeLevelIds) ? atlasBuildSchedulesGradeLevelIds : [],
          },
        });
      }

      return t;
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_CREATED",
      description: `Created personnel profile: ${teacher.lastName}, ${teacher.firstName} with roles: ${roles ? roles.join(', ') : 'TEACHER'}. Status: ${serviceStatus || 'ACTIVE'} (effective ${serviceEffectiveDate || 'now'})${serviceRemarks ? ` — ${serviceRemarks}` : ""}`,
      subjectType: "Teacher",
      recordId: teacher.id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [teacher.id],
    });

    res.json({ teacher });
  } catch (error: unknown) {
    const conflictField = getTeacherIdentityConflictField(error);
    if (conflictField === "employeeId") {
      return res.status(409).json({ message: "Employee ID already exists" });
    }

    if (conflictField === "email") {
      return res
        .status(409)
        .json({ message: "DepEd email address already exists" });
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function update(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  try {
    const {
      firstName,
      lastName,
      middleName,
      suffix,
      email,
      employeeId,
      contactNumber,
      sex,
      specialization,
      departments,
      plantillaPosition,
      roles,
      serviceStatus,
      serviceEffectiveDate,
      serviceRemarks,
      birthdate,
      personnelType,
      functionalAssignment,
      undergraduateDegree,
      bachelorMajor,
      bachelorMinor,
      bachelor_degree: bachelorDegree,
      bachelor_major: snakeCaseBachelorMajor,
      bachelor_minor: snakeCaseBachelorMinor,
      postgraduateDegree,
      majorSpecialization,
      minorSpecialization,
      indigenousCommunity,
      natureOfAppointment,
      fundingSource,
      accessExpirationDate,
      ancillaryRoles,
      postgraduateDegrees,
      atlasAssignTeachingLoad,
      atlasAssignTeachingLoadAllGrades,
      atlasAssignTeachingLoadGradeLevelIds,
      atlasBuildSchedules,
      atlasBuildSchedulesAllGrades,
      atlasBuildSchedulesGradeLevelIds,
    } = req.body;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalizedFirstName = normalizeRequiredUpperText(firstName);
    const normalizedLastName = normalizeRequiredUpperText(lastName);
    const normalizedEmployeeId = normalizeOptionalUpperText(employeeId);
    const normalizedEmail = normalizeOptionalLowerEmail(email);
    const normalizedContactNumber = normalizeContactNumber(contactNumber);
    const normalizedBachelorDegree = normalizeOptionalUpperText(undergraduateDegree ?? bachelorDegree);
    const normalizedBachelorMajor = normalizeOptionalUpperText(bachelorMajor ?? snakeCaseBachelorMajor);
    const normalizedBachelorMinor = normalizeOptionalUpperText(bachelorMinor ?? snakeCaseBachelorMinor);
    const isTemporary = isTemporaryAppointment(natureOfAppointment);
    const parsedAccessExpirationDate = isTemporary
      ? parseAccessExpirationDate(accessExpirationDate)
      : null;

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({
        message: "First name and last name are required",
      });
    }

    if (!isTemporary && !normalizedEmployeeId) {
      return res.status(400).json({
        message: "Employee ID is required for regular personnel",
      });
    }

    if (normalizedEmployeeId && !/^\d{7}$/.test(normalizedEmployeeId)) {
      return res.status(400).json({
        message: "Employee ID must be exactly 7 numeric digits",
      });
    }

    if (isTemporary && !parsedAccessExpirationDate) {
      return res.status(400).json({
        message: "Contract end date / access expiration is required for temporary personnel",
      });
    }

    if (!isValidContactNumber(normalizedContactNumber)) {
      return res
        .status(400)
        .json({ message: "Contact number must be exactly 11 digits" });
    }

    if (normalizedBachelorDegree && !normalizedBachelorMajor) {
      return res.status(422).json({
        message: "Bachelor degree major or specialization is required",
        errors: {
          bachelorMajor: ["Enter the bachelor degree major or specialization."],
        },
      });
    }

    const deptCodes = (Array.isArray(departments) ? departments.map(d => normalizeOptionalUpperText(d)).filter(Boolean) : []) as string[];
    const normalizedPostgraduateDegrees = normalizePostgraduateDegrees(postgraduateDegrees);
    const primaryPostgraduateDegree = normalizedPostgraduateDegrees[0] ?? null;

    const { teacher: updatedTeacher, designation: savedDesignation } = await prisma.$transaction(async (tx) => {
      // 1. Update the User record if it exists (linked by employeeId)
      const linkedUserWhere = existing.userId
        ? { id: existing.userId }
        : existing.employeeId
          ? { employeeId: existing.employeeId }
          : null;

      if (linkedUserWhere) {
        await tx.user.updateMany({
          where: linkedUserWhere,
          data: {
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          middleName: normalizeOptionalUpperText(middleName),
          suffix: normalizeOptionalUpperText(suffix),
          email: normalizedEmail,
          sex: req.body.sex === "MALE" ? "MALE" : "FEMALE",
          employeeId: normalizedEmployeeId,
          accessExpirationDate: parsedAccessExpirationDate,
          ...(roles ? { roles } : {}),
          ...(serviceStatus ? { isActive: serviceStatus === "ACTIVE" } : {}),
          },
        });
      }

      // 2. Update the Teacher profile
      const t = await tx.teacher.update({
        where: { id },
        data: {
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          middleName: normalizeOptionalUpperText(middleName),
          suffix: normalizeOptionalUpperText(suffix),
          email: normalizedEmail,
          employeeId: normalizedEmployeeId,
          contactNumber: normalizedContactNumber,
          sex: req.body.sex === "MALE" ? "MALE" : "FEMALE",
          specialization: normalizeOptionalUpperText(specialization),
          departments: { set: deptCodes.map(code => ({ code })) },
          plantillaPosition: normalizeOptionalUpperText(plantillaPosition),
          ...(serviceStatus ? { serviceStatus, isActive: serviceStatus === "ACTIVE" } : {}),
          birthdate: parseDateOnly(birthdate),
          personnelType: normalizeOptionalUpperText(personnelType),
          functionalAssignment: normalizeOptionalUpperText(functionalAssignment),
          undergraduateDegree: normalizedBachelorDegree,
          bachelorMajor: normalizedBachelorMajor,
          bachelorMinor: normalizedBachelorMinor,
          postgraduateDegree: primaryPostgraduateDegree?.degree ?? normalizeOptionalUpperText(postgraduateDegree),
          majorSpecialization: primaryPostgraduateDegree?.major ?? normalizeOptionalUpperText(majorSpecialization),
          minorSpecialization: primaryPostgraduateDegree?.minor ?? normalizeOptionalUpperText(minorSpecialization),
          indigenousCommunity: normalizeOptionalUpperText(indigenousCommunity),
          serviceEffectiveDate: parseDateOnly(serviceEffectiveDate),
          serviceRemarks: serviceRemarks || null,
          ...(natureOfAppointment ? { natureOfAppointment } : {}),
          ...(fundingSource ? { fundingSource } : {}),
        },
      });

      if (postgraduateDegrees !== undefined) {
        await tx.teacherPostgraduateDegree.deleteMany({ where: { teacherId: id } });
        if (normalizedPostgraduateDegrees.length > 0) {
          await tx.teacherPostgraduateDegree.createMany({
            data: normalizedPostgraduateDegrees.map((entry, sortOrder) => ({
              teacherId: id,
              ...entry,
              sortOrder,
            })),
          });
        }
      }

      let savedDesignation = null;
      if (
        (ancillaryRoles !== undefined ||
          atlasAssignTeachingLoad !== undefined ||
          atlasAssignTeachingLoadAllGrades !== undefined ||
          atlasAssignTeachingLoadGradeLevelIds !== undefined ||
          atlasBuildSchedules !== undefined ||
          atlasBuildSchedulesAllGrades !== undefined ||
          atlasBuildSchedulesGradeLevelIds !== undefined) &&
        req.schoolYearId
      ) {
        const updateData: Record<string, unknown> = {};
        if (ancillaryRoles !== undefined) updateData.ancillaryRoles = Array.isArray(ancillaryRoles) ? ancillaryRoles : [];
        if (atlasAssignTeachingLoad !== undefined) updateData.atlasAssignTeachingLoad = Boolean(atlasAssignTeachingLoad);
        if (atlasAssignTeachingLoadAllGrades !== undefined) updateData.atlasAssignTeachingLoadAllGrades = Boolean(atlasAssignTeachingLoadAllGrades);
        if (atlasAssignTeachingLoadGradeLevelIds !== undefined) updateData.atlasAssignTeachingLoadGradeLevelIds = Array.isArray(atlasAssignTeachingLoadGradeLevelIds) ? atlasAssignTeachingLoadGradeLevelIds : [];
        if (atlasBuildSchedules !== undefined) updateData.atlasBuildSchedules = Boolean(atlasBuildSchedules);
        if (atlasBuildSchedulesAllGrades !== undefined) updateData.atlasBuildSchedulesAllGrades = Boolean(atlasBuildSchedulesAllGrades);
        if (atlasBuildSchedulesGradeLevelIds !== undefined) updateData.atlasBuildSchedulesGradeLevelIds = Array.isArray(atlasBuildSchedulesGradeLevelIds) ? atlasBuildSchedulesGradeLevelIds : [];

        savedDesignation = await tx.teacherDesignation.upsert({
          where: {
            uq_teacher_designations_teacher_sy: {
              teacherId: id,
              schoolYearId: req.schoolYearId,
            },
          },
          update: updateData,
          create: {
            teacherId: id,
            schoolYearId: req.schoolYearId,
            ancillaryRoles: Array.isArray(ancillaryRoles) ? ancillaryRoles : [],
            atlasAssignTeachingLoad: Boolean(atlasAssignTeachingLoad),
            atlasAssignTeachingLoadAllGrades: atlasAssignTeachingLoadAllGrades !== undefined ? Boolean(atlasAssignTeachingLoadAllGrades) : true,
            atlasAssignTeachingLoadGradeLevelIds: Array.isArray(atlasAssignTeachingLoadGradeLevelIds) ? atlasAssignTeachingLoadGradeLevelIds : [],
            atlasBuildSchedules: Boolean(atlasBuildSchedules),
            atlasBuildSchedulesAllGrades: atlasBuildSchedulesAllGrades !== undefined ? Boolean(atlasBuildSchedulesAllGrades) : true,
            atlasBuildSchedulesGradeLevelIds: Array.isArray(atlasBuildSchedulesGradeLevelIds) ? atlasBuildSchedulesGradeLevelIds : [],
          },
        });
      }

      // Sync subjects
      // Backfill userId link if missing (for teachers created before the migration)
      if (!t.userId && normalizedEmployeeId) {
        const linkedUser = await tx.user.findFirst({
          where: { employeeId: normalizedEmployeeId },
          select: { id: true },
        });
        if (linkedUser) {
          await tx.teacher.update({
            where: { id },
            data: { userId: linkedUser.id },
          });
        }
      }

      return { teacher: t, designation: savedDesignation };
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_UPDATED",
      description: `Updated teacher profile: ${updatedTeacher.lastName}, ${updatedTeacher.firstName}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    if (serviceStatus && serviceStatus !== existing.serviceStatus) {
      await auditLog({
        userId: req.user!.userId,
        actionType: "TEACHER_SERVICE_STATUS_UPDATED",
        description: `Updated service status for ${updatedTeacher.lastName}, ${updatedTeacher.firstName}: ${serviceStatus} (effective ${serviceEffectiveDate})${serviceRemarks ? ` — ${serviceRemarks}` : ""}`,
        subjectType: "Teacher",
        recordId: id,
        req,
      });
    }

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [id],
    });

    res.json({
      teacher: {
        ...updatedTeacher,
        designation: savedDesignation,
      },
    });
  } catch (error: unknown) {
    const conflictField = getTeacherIdentityConflictField(error);
    if (conflictField === "employeeId") {
      return res.status(409).json({ message: "Employee ID already exists" });
    }

    if (conflictField === "email") {
      return res
        .status(409)
        .json({ message: "DepEd email address already exists" });
    }

    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function listSchedulePeriods(req: Request, res: Response) {
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  const querySchoolYearId =
    typeof req.query.schoolYearId === "string"
      ? parseInt(req.query.schoolYearId, 10)
      : req.schoolYearId;

  if (!querySchoolYearId || Number.isNaN(querySchoolYearId)) {
    return res.status(400).json({ message: "School year is required" });
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const periods = await prisma.teacherSchedulePeriod.findMany({
      where: { teacherId: id, schoolYearId: querySchoolYearId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const sorted = periods.sort((a, b) => {
      const dayDifference =
        (WEEKDAY_ORDER[a.dayOfWeek] ?? 99) - (WEEKDAY_ORDER[b.dayOfWeek] ?? 99);
      if (dayDifference !== 0) return dayDifference;
      return a.startTime.localeCompare(b.startTime);
    });

    const formatted = sorted.map(formatSchedulePeriod);
    const totalWeeklyMinutes = formatted.reduce(
      (sum, period) => sum + period.totalMinutes,
      0,
    );

    res.json({ periods: formatted, totalWeeklyMinutes });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}



export async function deactivate(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  const { reason } = req.body;

  try {
    // Check for active List of Classes across all school years that are not ARCHIVED
    const activeAssignments = await prisma.teacherDesignation.findMany({
      where: {
        teacherId: id,
        schoolYear: {
          status: { not: "ARCHIVED" },
        },
        OR: [{ isClassAdviser: true }],
      },
      include: {
        schoolYear: true,
        advisorySection: true,
      },
    });

    if (activeAssignments.length > 0) {
      const assignment = activeAssignments[0];
      const advisorySectionName =
        assignment.advisorySection?.name ?? "an assigned section";
      const context = `active advisory assignment for ${advisorySectionName}`;

      return res.status(409).json({
        message: `Cannot deactivate: This teacher has an ${context} in ${assignment.schoolYear.yearLabel}. You must reassign the advisory assignment before deactivating the account.`,
      });
    }

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacher = await prisma.$transaction(async (tx) => {
      // 1. Deactivate the User record
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        });
      } else if (existing.employeeId) {
        await tx.user.updateMany({
          where: { employeeId: existing.employeeId },
          data: { isActive: false },
        });
      }

      // 2. Deactivate the Teacher profile
      return await tx.teacher.update({
        where: { id },
        data: { isActive: false },
      });
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_DEACTIVATED",
      description: `Deactivated teacher: ${teacher.lastName}, ${teacher.firstName}. Reason: ${reason}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [id],
    });

    res.json({ teacher });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function reactivate(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  try {
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacher = await prisma.$transaction(async (tx) => {
      // 1. Reactivate the User record
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: true },
        });
      } else if (existing.employeeId) {
        await tx.user.updateMany({
          where: { employeeId: existing.employeeId },
          data: { isActive: true },
        });
      }

      // 2. Reactivate the Teacher profile
      return await tx.teacher.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_REACTIVATED",
      description: `Reactivated teacher: ${teacher.lastName}, ${teacher.firstName}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [id],
    });

    res.json({ teacher });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function updateServiceStatus(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  const { status, effectiveDate, remarks } = req.body as {
    status: string;
    effectiveDate: string;
    remarks?: string | null;
  };

  try {
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const isActive = status === "ACTIVE";

    const teacher = await prisma.$transaction(async (tx) => {
      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive },
        });
      } else if (existing.employeeId) {
        await tx.user.updateMany({
          where: { employeeId: existing.employeeId },
          data: { isActive },
        });
      }

      return await tx.teacher.update({
        where: { id },
        data: {
          serviceStatus: status,
          isActive,
        },
      });
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_SERVICE_STATUS_UPDATED",
      description: `Updated service status for ${teacher.lastName}, ${teacher.firstName}: ${status} (effective ${effectiveDate})${remarks ? ` — ${remarks}` : ""}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [id],
    });

    res.json({ teacher });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function showDesignation(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  const { schoolYearId } = req.query;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }

  try {
    const schoolContext = await prisma.schoolSetting.findFirst({
      include: {
        activeSchoolYear: true,
      },
    });

    if (!schoolContext?.activeSchoolYear) {
      return res.status(400).json({ message: "No active school year set" });
    }

    const syId = schoolYearId
      ? parseInt(schoolYearId as string)
      : schoolContext.activeSchoolYearId!;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        employeeId: true,
        designation: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const designation = await prisma.teacherDesignation.findUnique({
      where: {
        uq_teacher_designations_teacher_sy: {
          teacherId: id,
          schoolYearId: syId,
        },
      },
      include: {
        advisorySection: {
          include: { gradeLevel: true },
        },
        updatedBy: true,
      },
    });

    res.json({
      scope: {
        schoolId: schoolContext.id,
        schoolYearId: syId,
        schoolYearLabel: schoolContext.activeSchoolYear.yearLabel,
      },
      teacher: {
        ...teacher,
        designationTitle: teacher.designation,
        name: formatTeacherName(teacher),
      },
      designation: designation
        ? {
          ...designation,
          updatedByName: designation.updatedBy
            ? `${designation.updatedBy.lastName}, ${designation.updatedBy.firstName}`
            : null,
        }
        : null,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function validateDesignation(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  const { advisorySectionId, schoolYearId } = req.body;

  if (!advisorySectionId) {
    return res.json({ hasCollision: false });
  }

  try {
    const collision = await prisma.teacherDesignation.findFirst({
      where: {
        advisorySectionId,
        schoolYearId,
        teacherId: { not: id },
      },
      include: {
        teacher: true,
        advisorySection: { include: { gradeLevel: true } },
      },
    });

    if (collision) {
      return res.json({
        hasCollision: true,
        collision: {
          sectionId: collision.advisorySectionId,
          sectionName: collision.advisorySection?.name,
          gradeLevelName: collision.advisorySection?.gradeLevel.name,
          currentAdviserId: collision.teacherId,
          currentAdviserName: formatTeacherName(collision.teacher),
        },
      });
    }

    res.json({ hasCollision: false });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function upsertDesignation(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  const payload = req.body;

  try {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: payload.schoolYearId },
    });
    if (!schoolYear)
      return res.status(404).json({ message: "School year not found" });

    const advisorySectionId = payload.advisorySectionId
      ? parseInt(payload.advisorySectionId)
      : null;

    const collision = advisorySectionId
      ? await prisma.teacherDesignation.findFirst({
        where: {
          advisorySectionId,
          schoolYearId: payload.schoolYearId,
          teacherId: { not: id },
        },
      })
      : null;

    if (collision && !payload.allowAdviserOverride) {
      return res.status(409).json({ message: "Adviser collision detected" });
    }

    const designation = await prisma.$transaction(async (tx) => {
      if (collision && payload.allowAdviserOverride) {
        // 1. Close active ledger for current section adviser
        const currentActiveAdviser = await tx.sectionAdviser.findFirst({
          where: {
            sectionId: advisorySectionId!,
            schoolYearId: payload.schoolYearId,
            status: SectionAdviserStatus.ACTIVE,
          },
        });

        if (currentActiveAdviser) {
          await tx.sectionAdviser.update({
            where: { id: currentActiveAdviser.id },
            data: {
              status: SectionAdviserStatus.HANDED_OVER,
              effectiveTo: new Date(),
              handoverReason:
                "Administrative Handover (via Teacher Management)",
            },
          });
        }

        // 2. Relieve old adviser's designation
        await tx.teacherDesignation.update({
          where: { id: collision.id },
          data: {
            isClassAdviser: false,
            advisorySectionId: null,
          },
        });
      }

      // 3. Update/Create teacher designation
      const d = await tx.teacherDesignation.upsert({
        where: {
          uq_teacher_designations_teacher_sy: {
            teacherId: id,
            schoolYearId: payload.schoolYearId,
          },
        },
        update: {
          isClassAdviser: payload.isClassAdviser,
          advisorySectionId,
          ancillaryRoles: payload.ancillaryRoles || [],
          atlasAssignTeachingLoad: payload.atlasAssignTeachingLoad !== undefined ? Boolean(payload.atlasAssignTeachingLoad) : false,
          atlasAssignTeachingLoadAllGrades: payload.atlasAssignTeachingLoadAllGrades !== undefined ? Boolean(payload.atlasAssignTeachingLoadAllGrades) : true,
          atlasAssignTeachingLoadGradeLevelIds: Array.isArray(payload.atlasAssignTeachingLoadGradeLevelIds) ? payload.atlasAssignTeachingLoadGradeLevelIds : [],
          atlasBuildSchedules: payload.atlasBuildSchedules !== undefined ? Boolean(payload.atlasBuildSchedules) : false,
          atlasBuildSchedulesAllGrades: payload.atlasBuildSchedulesAllGrades !== undefined ? Boolean(payload.atlasBuildSchedulesAllGrades) : true,
          atlasBuildSchedulesGradeLevelIds: Array.isArray(payload.atlasBuildSchedulesGradeLevelIds) ? payload.atlasBuildSchedulesGradeLevelIds : [],
          designationNotes: normalizeOptionalText(payload.designationNotes),
          effectiveFrom: parseDateOnly(payload.effectiveFrom),
          effectiveTo: parseDateOnly(payload.effectiveTo),
          updateReason: normalizeOptionalText(payload.reason),
          updatedById: req.user!.userId,
        },
        create: {
          teacherId: id,
          schoolYearId: payload.schoolYearId,
          isClassAdviser: payload.isClassAdviser,
          advisorySectionId,
          ancillaryRoles: payload.ancillaryRoles || [],
          atlasAssignTeachingLoad: payload.atlasAssignTeachingLoad !== undefined ? Boolean(payload.atlasAssignTeachingLoad) : false,
          atlasAssignTeachingLoadAllGrades: payload.atlasAssignTeachingLoadAllGrades !== undefined ? Boolean(payload.atlasAssignTeachingLoadAllGrades) : true,
          atlasAssignTeachingLoadGradeLevelIds: Array.isArray(payload.atlasAssignTeachingLoadGradeLevelIds) ? payload.atlasAssignTeachingLoadGradeLevelIds : [],
          atlasBuildSchedules: payload.atlasBuildSchedules !== undefined ? Boolean(payload.atlasBuildSchedules) : false,
          atlasBuildSchedulesAllGrades: payload.atlasBuildSchedulesAllGrades !== undefined ? Boolean(payload.atlasBuildSchedulesAllGrades) : true,
          atlasBuildSchedulesGradeLevelIds: Array.isArray(payload.atlasBuildSchedulesGradeLevelIds) ? payload.atlasBuildSchedulesGradeLevelIds : [],
          designationNotes: normalizeOptionalText(payload.designationNotes),
          effectiveFrom: parseDateOnly(payload.effectiveFrom),
          effectiveTo: parseDateOnly(payload.effectiveTo),
          updateReason: normalizeOptionalText(payload.reason),
          updatedById: req.user!.userId,
        },
        include: {
          updatedBy: true,
          advisorySection: { include: { gradeLevel: true } },
        },
      });

      // 4. Update section adviser ledger if becoming class adviser
      if (payload.isClassAdviser && advisorySectionId) {
        // Ensure this teacher doesn't already have an active ledger for this section
        const alreadyActive = await tx.sectionAdviser.findFirst({
          where: {
            sectionId: advisorySectionId,
            teacherId: id,
            schoolYearId: payload.schoolYearId,
            status: SectionAdviserStatus.ACTIVE,
          },
        });

        if (!alreadyActive) {
          await tx.sectionAdviser.create({
            data: {
              sectionId: advisorySectionId,
              teacherId: id,
              schoolYearId: payload.schoolYearId,
              status: SectionAdviserStatus.ACTIVE,
              effectiveFrom: parseDateOnly(payload.effectiveFrom) || new Date(),
            },
          });
        }
      } else if (!payload.isClassAdviser) {
        // If being relieved, close any active ledger
        await tx.sectionAdviser.updateMany({
          where: {
            teacherId: id,
            schoolYearId: payload.schoolYearId,
            status: SectionAdviserStatus.ACTIVE,
          },
          data: {
            status: SectionAdviserStatus.REVOKED,
            effectiveTo: new Date(),
            handoverReason: "Designation Revoked",
          },
        });
      }

      return d;
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "TEACHER_DESIGNATION_UPDATED",
      description: `Updated designation for ${formatTeacherName(teacher)} in school year ${schoolYear.yearLabel}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: payload.schoolYearId,
      teacherIds: [id],
      sectionIds: advisorySectionId ? [advisorySectionId] : undefined,
    });

    res.json({
      designation: {
        ...designation,
        updatedByName: designation.updatedBy
          ? `${designation.updatedBy.lastName}, ${designation.updatedBy.firstName}`
          : null,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const { password } = req.body;
    let defaultPassword = password;
    if (!defaultPassword) {
      const settings = await prisma.schoolSetting.findFirst();
      defaultPassword = settings?.globalDefaultPassword || "DepEd2026!";
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    let userId = teacher.userId;
    if (!userId) {
      const userData = {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName,
        email: teacher.email,
        sex: teacher.sex,
        isActive: true,
      };
      const upsertedUser = teacher.employeeId
        ? await prisma.user.upsert({
          where: { employeeId: teacher.employeeId },
          update: userData,
          create: {
            ...userData,
            employeeId: teacher.employeeId,
            accountName: teacher.employeeId,
            password: hashedPassword,
            roles: [Role.TEACHER],
            mustChangePassword: true,
          },
        })
        : await prisma.user.create({
          data: {
            ...userData,
            employeeId: null,
            accountName: null,
            password: hashedPassword,
            roles: [Role.TEACHER],
            mustChangePassword: true,
          },
        });
      userId = upsertedUser.id;
      await prisma.teacher.update({ where: { id }, data: { userId } });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "ADMIN_PASSWORD_RESET",
      description: `Admin reset teacher portal password for: ${teacher.lastName}, ${teacher.firstName}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    res.json({ message: "Teacher portal password reset successfully" });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function togglePortalAccess(req: Request, res: Response) {
  const idStr = String(req.params.id);
  const id = parseInt(idStr);
  const { isActive } = req.body;
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid teacher ID" });
  }
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive is required and must be boolean" });
  }
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    let userId = teacher.userId;
    if (!userId) {
      const defaultPasswordHash = await bcrypt.hash("DepEd2026!", 10);
      const userData = {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName,
        email: teacher.email,
        sex: teacher.sex,
        isActive,
      };
      const upsertedUser = teacher.employeeId
        ? await prisma.user.upsert({
          where: { employeeId: teacher.employeeId },
          update: userData,
          create: {
            ...userData,
            employeeId: teacher.employeeId,
            accountName: teacher.employeeId,
            password: defaultPasswordHash,
            roles: [Role.TEACHER],
            mustChangePassword: true,
          },
        })
        : await prisma.user.create({
          data: {
            ...userData,
            employeeId: null,
            accountName: null,
            password: defaultPasswordHash,
            roles: [Role.TEACHER],
            mustChangePassword: true,
          },
        });
      userId = upsertedUser.id;
      await prisma.teacher.update({ where: { id }, data: { userId } });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: { isActive },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: isActive ? "ADMIN_USER_REACTIVATED" : "ADMIN_USER_DEACTIVATED",
      description: `Admin updated teacher portal status to ${isActive ? "ACTIVE" : "LOCKED"} for: ${teacher.lastName}, ${teacher.firstName}`,
      subjectType: "Teacher",
      recordId: id,
      req,
    });

    broadcastTeacherInvalidation({
      schoolYearId: req.schoolYearId,
      teacherIds: [id],
    });

    res.json({ teacher: updatedTeacher });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
}

export async function uploadPhoto(req: Request, res: Response) {
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid teacher ID" });
  if (!req.file) return res.status(400).json({ message: "Select a JPEG, PNG, or WEBP photo" });

  try {
    const existing = await prisma.teacher.findUnique({ where: { id }, select: { photoPath: true } });
    if (!existing) return res.status(404).json({ message: "Teacher not found" });

    const photoPath = `/uploads/${req.file.filename}`;
    const teacher = await prisma.teacher.update({ where: { id }, data: { photoPath } });
    await removeUploadedTeacherPhoto(existing.photoPath);
    broadcastTeacherInvalidation({ schoolYearId: req.schoolYearId, teacherIds: [id] });
    return res.json({ teacher, photoPath });
  } catch (error: unknown) {
    await removeUploadedTeacherPhoto(`/uploads/${req.file.filename}`);
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
}

export async function removePhoto(req: Request, res: Response) {
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid teacher ID" });

  try {
    const existing = await prisma.teacher.findUnique({ where: { id }, select: { photoPath: true } });
    if (!existing) return res.status(404).json({ message: "Teacher not found" });
    const teacher = await prisma.teacher.update({ where: { id }, data: { photoPath: null } });
    await removeUploadedTeacherPhoto(existing.photoPath);
    broadcastTeacherInvalidation({ schoolYearId: req.schoolYearId, teacherIds: [id] });
    return res.json({ teacher, photoPath: null });
  } catch (error: unknown) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
}
