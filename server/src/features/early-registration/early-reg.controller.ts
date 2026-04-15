import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { auditLog } from "../audit-logs/audit-logs.service.js";
import { AppError } from "../../lib/AppError.js";
import {
  LearnerType,
  FamilyRelationship,
  ApplicationStatus,
  AdmissionChannel,
  PrimaryContactType,
} from "../../generated/prisma/index.js";

// ── Helpers ──

/** Recursively converts all string values to uppercase and trims them. */
function toUpperCaseRecursive(obj: unknown): unknown {
  const skipKeys = ["contactNumber", "email", "emailAddress"];

  if (Array.isArray(obj)) {
    return obj.map((v) => toUpperCaseRecursive(v));
  } else if (
    obj !== null &&
    typeof obj === "object" &&
    !(obj instanceof Date)
  ) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (skipKeys.includes(key)) {
        newObj[key] = (obj as Record<string, unknown>)[key];
      } else {
        newObj[key] = toUpperCaseRecursive(
          (obj as Record<string, unknown>)[key],
        );
      }
    }
    return newObj;
  } else if (typeof obj === "string") {
    return obj.trim().toUpperCase();
  }
  return obj;
}

/** Calculate age from birthdate in Asia/Manila timezone. */
function calculateAge(birthdate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const monthDiff = now.getMonth() - birthdate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthdate.getDate())
  ) {
    age--;
  }
  return age;
}

/** Normalize a date to noon UTC for consistent date-only storage. */
function normalizeDateToUtcNoon(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

const LEARNER_TYPE_VALUES = new Set([
  "NEW_ENROLLEE",
  "TRANSFEREE",
  "RETURNING",
  "CONTINUING",
  "OSCYA",
  "ALS",
]);

const PRIMARY_CONTACT_VALUES = new Set(["FATHER", "MOTHER", "GUARDIAN"]);

const APPLICANT_TYPE_VALUES = new Set([
  "REGULAR",
  "SCIENCE_TECHNOLOGY_AND_ENGINEERING",
  "SPECIAL_PROGRAM_IN_THE_ARTS",
  "SPECIAL_PROGRAM_IN_SPORTS",
  "SPECIAL_PROGRAM_IN_JOURNALISM",
  "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE",
  "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION",
]);

type ApplicantTypeValue =
  | "REGULAR"
  | "SCIENCE_TECHNOLOGY_AND_ENGINEERING"
  | "SPECIAL_PROGRAM_IN_THE_ARTS"
  | "SPECIAL_PROGRAM_IN_SPORTS"
  | "SPECIAL_PROGRAM_IN_JOURNALISM"
  | "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE"
  | "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION";

function normalizeGradeLevelToken(value: unknown): string {
  const raw = String(value ?? "").trim();
  const digitMatch = raw.match(/\d+/);
  return digitMatch?.[0] ?? raw;
}

function toLearnerTypeV2(value: unknown): LearnerType | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!LEARNER_TYPE_VALUES.has(raw)) return null;
  return raw as LearnerType;
}

function toPrimaryContactV2(value: unknown): PrimaryContactType | null {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!PRIMARY_CONTACT_VALUES.has(raw)) return null;
  return raw as PrimaryContactType;
}

function resolveApplicantType(
  isScpApplication: unknown,
  scpType: unknown,
): ApplicantTypeValue {
  if (!isScpApplication) {
    return "REGULAR";
  }

  const rawScpType = String(scpType ?? "")
    .trim()
    .toUpperCase();

  if (rawScpType === "REGULAR" || !APPLICANT_TYPE_VALUES.has(rawScpType)) {
    throw new AppError(400, "Selected SCP track is invalid.");
  }

  return rawScpType as ApplicantTypeValue;
}

// ── Shared store logic for both public and F2F ──

interface StoreOptions {
  channel: AdmissionChannel;
  encodedById?: number | null;
}

function mapCreateRegistrationDuplicateError(error: unknown): AppError | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code?: string }).code !== "P2002"
  ) {
    return null;
  }

  const targetMeta = (error as { meta?: { target?: string[] | string } }).meta
    ?.target;
  const targets = Array.isArray(targetMeta)
    ? targetMeta.map((value) => String(value).toLowerCase())
    : typeof targetMeta === "string"
      ? [targetMeta.toLowerCase()]
      : [];

  const hasTarget = (needle: string) =>
    targets.some((target) => target.includes(needle));

  const isLrnDuplicate = hasTarget("lrn") || hasTarget("uq_learners_lrn");
  if (isLrnDuplicate) {
    return new AppError(409, "A learner with this LRN already exists.");
  }

  const isRegistrantSchoolYearDuplicate =
    hasTarget("uq_early_reg_per_sy") ||
    ((hasTarget("learnerid") || hasTarget("learner_id")) &&
      (hasTarget("schoolyearid") || hasTarget("school_year_id")));

  if (isRegistrantSchoolYearDuplicate) {
    return new AppError(
      409,
      "An early registration for this learner already exists for this School Year.",
    );
  }

  return new AppError(
    409,
    "A duplicate early registration record was detected.",
  );
}

async function createRegistration(
  req: Request,
  res: Response,
  next: NextFunction,
  options: StoreOptions,
) {
  try {
    // 1. Get active school year
    const settings = await prisma.schoolSetting.findFirst({
      include: { activeSchoolYear: true },
    });

    if (!settings?.activeSchoolYear) {
      throw new AppError(
        400,
        "No active School Year is set. Please contact the school registrar.",
      );
    }

    const activeYear = settings.activeSchoolYear;
    const body = toUpperCaseRecursive(req.body) as Record<string, any>;

    const normalizedGradeLevel = normalizeGradeLevelToken(body.gradeLevel);
    const gradeLevelV2 = await prisma.gradeLevel.findFirst({
      where: {
        schoolYearId: activeYear.id,
        OR: [
          { name: { equals: normalizedGradeLevel, mode: "insensitive" } },
          {
            name: {
              equals: `GRADE ${normalizedGradeLevel}`,
              mode: "insensitive",
            },
          },
          { name: { equals: `G${normalizedGradeLevel}`, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!gradeLevelV2) {
      throw new AppError(
        400,
        `Grade Level "${body.gradeLevel}" not found for the active School Year.`,
      );
    }

    const learnerTypeV2 = toLearnerTypeV2(body.learnerType);
    const primaryContactV2 = toPrimaryContactV2(body.primaryContact);
    const applicantType = resolveApplicantType(
      body.isScpApplication,
      body.scpType,
    );

    if (applicantType !== "REGULAR") {
      const offeredScpConfig = await prisma.scpProgramConfig.findFirst({
        where: {
          schoolYearId: activeYear.id,
          scpType: applicantType,
          isOffered: true,
        },
        select: { id: true },
      });

      if (!offeredScpConfig) {
        throw new AppError(
          422,
          "The selected SCP track is not available for the active School Year.",
        );
      }
    }

    // 2. Parse and validate birthdate
    const rawBirthDate = new Date(body.birthdate);
    if (isNaN(rawBirthDate.getTime())) {
      throw new AppError(400, "Enter a valid birthdate in MM/DD/YYYY format.");
    }
    const birthDate = normalizeDateToUtcNoon(rawBirthDate);
    const age = calculateAge(rawBirthDate);

    // 3. Check duplicate LRN in same School Year (both early reg + enrollment app tables)
    const lrn: string | null = body.lrn?.trim() || null;
    if (lrn) {
      const existingEarlyReg = await prisma.learner.findFirst({
        where: {
          lrn,
          earlyRegistrationApplications: {
            some: { schoolYearId: activeYear.id },
          },
        },
        select: { id: true },
      });
      if (existingEarlyReg) {
        throw new AppError(
          409,
          `A registration with LRN ${lrn} already exists for this School Year.`,
        );
      }

      const existingEnrollmentApp =
        await prisma.enrollmentApplication.findFirst({
          where: { learner: { lrn }, schoolYearId: activeYear.id },
          select: { id: true },
        });
      if (existingEnrollmentApp) {
        throw new AppError(
          409,
          `An enrollment application with LRN ${lrn} already exists for this School Year.`,
        );
      }
    }

    // 4. Build guardian data
    const guardianData: {
      relationship: FamilyRelationship;
      lastName: string;
      firstName: string;
      middleName?: string | null;
      contactNumber?: string | null;
      email?: string | null;
      occupation?: string | null;
    }[] = [];

    if (body.father?.lastName && body.father?.firstName) {
      guardianData.push({
        relationship: "FATHER",
        lastName: body.father.lastName,
        firstName: body.father.firstName,
        middleName: body.father.middleName || null,
        contactNumber: body.father.contactNumber || null,
        email: body.father.email || null,
        occupation: body.father.occupation || null,
      });
    }
    if (body.mother?.maidenName && body.mother?.firstName) {
      guardianData.push({
        relationship: "MOTHER",
        lastName: body.mother.maidenName,
        firstName: body.mother.firstName,
        middleName: body.mother.middleName || null,
        contactNumber: body.mother.contactNumber || null,
        email: body.mother.email || null,
        occupation: body.mother.occupation || null,
      });
    }
    if (body.guardian?.lastName && body.guardian?.firstName) {
      guardianData.push({
        relationship: "GUARDIAN",
        lastName: body.guardian.lastName,
        firstName: body.guardian.firstName,
        middleName: body.guardian.middleName || null,
        contactNumber: body.guardian.contactNumber || null,
        email: body.guardian.email || null,
        occupation: body.guardian.occupation || null,
      });
    }

    // 5. Create/reuse learner + guardians + registration in a transaction
    const learnerPayload = {
      lrn,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName || null,
      extensionName: body.extensionName || null,
      birthdate: birthDate,
      sex: body.sex === "MALE" ? ("MALE" as const) : ("FEMALE" as const),
      religion: body.religion || null,
      isIpCommunity: body.isIpCommunity ?? false,
      ipGroupName: body.isIpCommunity ? body.ipGroupName : null,
      isLearnerWithDisability: body.isLearnerWithDisability ?? false,
      disabilityTypes: body.isLearnerWithDisability
        ? body.disabilityTypes || []
        : [],
    };

    const result = await prisma.$transaction(async (tx) => {
      let learner: { id: number };

      if (lrn) {
        const existingLearner = await tx.learner.findUnique({
          where: { lrn },
          select: { id: true },
        });

        if (existingLearner) {
          learner = await tx.learner.update({
            where: { id: existingLearner.id },
            data: learnerPayload,
            select: { id: true },
          });
        } else {
          learner = await tx.learner.create({
            data: learnerPayload,
            select: { id: true },
          });
        }
      } else {
        learner = await tx.learner.create({
          data: learnerPayload,
          select: { id: true },
        });
      }

      // Temporary tracking number
      const tempTracking = `EREG-${new Date().getFullYear()}-TEMP-${Date.now()}`;

      const application = await tx.earlyRegistrationApplication.create({
        data: {
          learnerId: learner.id,
          schoolYearId: activeYear.id,
          gradeLevelId: gradeLevelV2.id,
          applicantType,
          learnerType: (body.learnerType as LearnerType) || "NEW_ENROLLEE",
          status: "SUBMITTED",
          channel: options.channel,
          contactNumber: body.contactNumber,
          email: body.email || null,
          primaryContact: primaryContactV2,
          isPrivacyConsentGiven: body.isPrivacyConsentGiven ?? false,
          encodedById: options.encodedById ?? null,
          trackingNumber: tempTracking,
          guardians: {
            createMany: { data: guardianData },
          },
        },
        select: { id: true, applicantType: true },
      });

      // Update with final tracking number
      let prefix = "REG";
      if (application.applicantType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING") {
        prefix = "STE";
      } else if (application.applicantType === "SPECIAL_PROGRAM_IN_THE_ARTS") {
        prefix = "SPA";
      } else if (application.applicantType === "SPECIAL_PROGRAM_IN_SPORTS") {
        prefix = "SPS";
      } else if (application.applicantType === "SPECIAL_PROGRAM_IN_JOURNALISM") {
        prefix = "SPJ";
      } else if (
        application.applicantType === "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE"
      ) {
        prefix = "SPFL";
      } else if (
        application.applicantType ===
        "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION"
      ) {
        prefix = "SPTVE";
      }

      const trackingNumber = `${prefix}-${new Date().getFullYear()}-${String(application.id).padStart(5, "0")}`;
      await tx.earlyRegistrationApplication.update({
        where: { id: application.id },
        data: { trackingNumber },
      });

      return { learner, application, trackingNumber };
    });

    // 6. Audit log (non-blocking)
    auditLog({
      userId: options.encodedById ?? null,
      actionType: "EARLY_REGISTRATION_SUBMITTED",
      description: `Early registration submitted for ${body.lastName}, ${body.firstName} — Grade ${body.gradeLevel} (${options.channel}). Tracking: ${result.trackingNumber}.`,
      subjectType: "EarlyRegistrationApplication",
      recordId: result.application.id,
      req,
    }).catch(() => {});

    res.status(201).json({
      id: result.application.id,
      trackingNumber: result.trackingNumber,
      learnerId: result.learner.id,
      gradeLevel: body.gradeLevel,
      applicantType,
      learnerName: `${body.lastName}, ${body.firstName}`,
      age,
      message: "Your early registration has been submitted successfully.",
    });
  } catch (err) {
    console.error("[createRegistration Error]", err);
    const mappedDuplicateError = mapCreateRegistrationDuplicateError(err);
    next(mappedDuplicateError ?? err);
  }
}

/** GET /check-lrn/:lrn — Check if LRN already exists for active school year */
export async function checkLrn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lrn = String(req.params.lrn || "").trim();
    if (!lrn || lrn.length !== 12) {
      throw new AppError(400, "Enter a valid 12-digit LRN.");
    }

    const settings = await prisma.schoolSetting.findFirst({
      include: { activeSchoolYear: true },
    });

    if (!settings?.activeSchoolYear) {
      throw new AppError(
        400,
        "No active School Year is set. Please contact the school registrar.",
      );
    }

    const activeYear = settings.activeSchoolYear;

    // Check early registrations
    const existingEarlyReg = await prisma.learner.findFirst({
      where: {
        lrn,
        earlyRegistrationApplications: {
          some: { schoolYearId: activeYear.id },
        },
      },
      select: { id: true },
    });

    if (existingEarlyReg) {
      return res.json({
        exists: true,
        type: "EARLY_REGISTRATION",
        message: `A registration with LRN ${lrn} already exists for this School Year.`,
      });
    }

    // Check enrollment applications
    const existingEnrollmentApp = await prisma.enrollmentApplication.findFirst({
      where: { learner: { lrn }, schoolYearId: activeYear.id },
      select: { id: true },
    });

    if (existingEnrollmentApp) {
      return res.json({
        exists: true,
        type: "ENROLLMENT",
        message: `An enrollment application with LRN ${lrn} already exists for this School Year.`,
      });
    }

    res.json({ exists: false });
  } catch (err) {
    next(err);
  }
}

// ── Public Handlers ──

/** POST / — Public early registration submission */
export async function store(req: Request, res: Response, next: NextFunction) {
  return createRegistration(req, res, next, { channel: "ONLINE" });
}

/** POST /f2f — Registrar-encoded early registration */
export async function storeF2F(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  return createRegistration(req, res, next, {
    channel: "F2F",
    encodedById: req.user?.userId,
  });
}

/** GET / — List early registrations for active/specified school year */
export async function index(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit)) || 20),
    );
    const search = (req.query.search as string)?.trim() || "";
    const status = (req.query.status as string) || "";
    const gradeLevel = (req.query.gradeLevel as string) || "";
    const applicantType = (req.query.applicantType as string) || "";

    // Resolve school year
    let schoolYearId: number | undefined;
    if (req.query.schoolYearId) {
      schoolYearId = parseInt(String(req.query.schoolYearId));
    } else {
      const settings = await prisma.schoolSetting.findFirst();
      schoolYearId = settings?.activeSchoolYearId ?? undefined;
    }

    if (!schoolYearId) {
      throw new AppError(400, "No school year specified or active.");
    }
    const resolvedSchoolYearId = schoolYearId;

    const where: any = {
      schoolYearId: resolvedSchoolYearId,
    };
    const andFilters: any[] = [];

    if (status) {
      andFilters.push({ status });
    }

    if (applicantType) {
      const normalizedApplicantType = applicantType.trim().toUpperCase();
      if (normalizedApplicantType !== "ALL") {
        if (!APPLICANT_TYPE_VALUES.has(normalizedApplicantType)) {
          throw new AppError(400, "Invalid applicant type filter.");
        }
        andFilters.push({ applicantType: normalizedApplicantType });
      }
    }

    if (gradeLevel) {
      const normalizedGradeLevel = normalizeGradeLevelToken(gradeLevel);
      const matchingGradeLevels = await prisma.gradeLevel.findMany({
        where: {
          schoolYearId: resolvedSchoolYearId,
          OR: [
            { name: { equals: normalizedGradeLevel, mode: "insensitive" } },
            {
              name: {
                equals: `GRADE ${normalizedGradeLevel}`,
                mode: "insensitive",
              },
            },
            {
              name: { equals: `G${normalizedGradeLevel}`, mode: "insensitive" },
            },
          ],
        },
        select: { id: true },
      });

      if (matchingGradeLevels.length > 0) {
        andFilters.push({
          gradeLevelId: { in: matchingGradeLevels.map((g) => g.id) },
        });
      }
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    if (search) {
      where.learner = {
        OR: [
          { lastName: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lrn: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [registrations, total] = await Promise.all([
      prisma.earlyRegistrationApplication.findMany({
        where: where,
        include: {
          learner: true,
          guardians: true,
          gradeLevel: { select: { id: true, name: true } },
          schoolYear: { select: { yearLabel: true } },
          encodedBy: { select: { firstName: true, lastName: true } },
          verifiedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.earlyRegistrationApplication.count({ where: where }),
    ]);

    res.json({
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /:id — Get a single early registration detail */
export async function show(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params.id));
    const registration = await prisma.earlyRegistrationApplication.findUnique({
      where: { id },
      include: {
        learner: true,
        guardians: true,
        gradeLevel: { select: { id: true, name: true } },
        schoolYear: { select: { yearLabel: true } },
        encodedBy: { select: { firstName: true, lastName: true } },
        verifiedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!registration) {
      throw new AppError(404, "Early registration not found.");
    }

    res.json(registration);
  } catch (err) {
    next(err);
  }
}

/** PATCH /:id/verify — Registrar marks a registration as verified */
export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params.id));
    const registration = await prisma.earlyRegistrationApplication.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new AppError(404, "Early registration not found.");
    }

    if (registration.status !== "SUBMITTED") {
      throw new AppError(
        422,
        `Cannot verify a registration with status "${registration.status}".`,
      );
    }

    const updated = await prisma.earlyRegistrationApplication.update({
      where: { id },
      data: {
        status: "VERIFIED" as ApplicationStatus,
        verifiedAt: new Date(),
        verifiedById: req.user!.userId,
      },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "EARLY_REGISTRATION_VERIFIED",
      description: `Early registration #${id} verified.`,
      subjectType: "EarlyRegistrationApplication",
      recordId: id,
      req,
    }).catch(() => {});

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
