import type { Request, Response } from "express";
import {
  createSchoolYearControllerDeps,
  SchoolYearControllerDeps,
} from "../services/school-year-controller.deps.js";
import {
  cloneSchoolYearStructure,
  ensureDefaultGradeLevels,
  getCurrentManilaYear,
  parseDateInput,
  setActiveSchoolYear,
} from "../services/school-year-controller-shared.service.js";

function parseSchoolYearId(req: Request): number {
  return Number.parseInt(String(req.params.id ?? ""), 10);
}

const EOSY_SKIP_OUTCOMES = new Set(["DROPPED_OUT", "TRANSFERRED_OUT"]);
const EOSY_RETAINED_OUTCOMES = new Set(["RETAINED", "IRREGULAR"]);

interface RolloverSummary {
  processedRecords: number;
  createdApplications: number;
  skippedByEosyOutcome: number;
  skippedNoTargetGrade: number;
  skippedExistingApplications: number;
  skippedDuplicateRecords: number;
}

function parseStartYearFromLabel(yearLabel: string): number {
  const parsed = Number.parseInt(yearLabel.split("-")[0] ?? "", 10);
  return Number.isInteger(parsed) ? parsed : new Date().getUTCFullYear();
}

function buildEnrollmentTrackingNumber(
  startYear: number,
  enrollmentApplicationId: number,
): string {
  return `F2F-ENR-${startYear}-${String(enrollmentApplicationId).padStart(5, "0")}`;
}

async function carryOverEligibleLearners(
  deps: SchoolYearControllerDeps,
  sourceSchoolYearId: number,
  targetSchoolYearId: number,
  targetStartYear: number,
  actingUserId: number | null,
): Promise<RolloverSummary> {
  const [sourceRecords, targetGradeLevels, existingTargetApplications] =
    await Promise.all([
      deps.prisma.enrollmentRecord.findMany({
        where: {
          schoolYearId: sourceSchoolYearId,
          enrollmentApplication: {
            status: "ENROLLED",
          },
        },
        select: {
          eosyStatus: true,
          enrollmentApplication: {
            select: {
              learnerId: true,
              applicantType: true,
              isPrivacyConsentGiven: true,
              guardianRelationship: true,
              hasNoMother: true,
              hasNoFather: true,
              encodedById: true,
            },
          },
          section: {
            select: {
              gradeLevel: {
                select: {
                  displayOrder: true,
                },
              },
            },
          },
        },
      }),
      deps.prisma.gradeLevel.findMany({
        where: { schoolYearId: targetSchoolYearId },
        select: {
          id: true,
          displayOrder: true,
        },
      }),
      deps.prisma.enrollmentApplication.findMany({
        where: { schoolYearId: targetSchoolYearId },
        select: {
          learnerId: true,
        },
      }),
    ]);

  const targetGradeLevelByDisplayOrder = new Map<number, { id: number }>();
  for (const gradeLevel of targetGradeLevels) {
    targetGradeLevelByDisplayOrder.set(gradeLevel.displayOrder, {
      id: gradeLevel.id,
    });
  }

  const existingTargetLearnerIds = new Set<number>(
    existingTargetApplications.map((application) => application.learnerId),
  );
  const processedLearnerIds = new Set<number>();

  const summary: RolloverSummary = {
    processedRecords: sourceRecords.length,
    createdApplications: 0,
    skippedByEosyOutcome: 0,
    skippedNoTargetGrade: 0,
    skippedExistingApplications: 0,
    skippedDuplicateRecords: 0,
  };

  for (const record of sourceRecords) {
    const learnerId = record.enrollmentApplication.learnerId;

    if (processedLearnerIds.has(learnerId)) {
      summary.skippedDuplicateRecords += 1;
      continue;
    }
    processedLearnerIds.add(learnerId);

    if (existingTargetLearnerIds.has(learnerId)) {
      summary.skippedExistingApplications += 1;
      continue;
    }

    const eosyStatus = record.eosyStatus ?? "PROMOTED";
    if (EOSY_SKIP_OUTCOMES.has(eosyStatus)) {
      summary.skippedByEosyOutcome += 1;
      continue;
    }

    const sourceDisplayOrder = record.section.gradeLevel.displayOrder;
    const targetDisplayOrder =
      eosyStatus === "PROMOTED" ? sourceDisplayOrder + 1 : sourceDisplayOrder;
    const targetGradeLevel =
      targetGradeLevelByDisplayOrder.get(targetDisplayOrder) ?? null;

    if (!targetGradeLevel) {
      summary.skippedNoTargetGrade += 1;
      continue;
    }

    const createdApplication = await deps.prisma.enrollmentApplication.create({
      data: {
        learnerId,
        schoolYearId: targetSchoolYearId,
        gradeLevelId: targetGradeLevel.id,
        applicantType: record.enrollmentApplication.applicantType,
        learnerType: "CONTINUING",
        status: "READY_FOR_ENROLLMENT",
        admissionChannel: "F2F",
        isPrivacyConsentGiven:
          record.enrollmentApplication.isPrivacyConsentGiven,
        guardianRelationship: record.enrollmentApplication.guardianRelationship,
        hasNoMother: record.enrollmentApplication.hasNoMother,
        hasNoFather: record.enrollmentApplication.hasNoFather,
        encodedById:
          record.enrollmentApplication.encodedById ?? actingUserId ?? null,
      },
      select: {
        id: true,
      },
    });

    const trackingNumber = buildEnrollmentTrackingNumber(
      targetStartYear,
      createdApplication.id,
    );
    await deps.prisma.enrollmentApplication.update({
      where: { id: createdApplication.id },
      data: { trackingNumber },
    });

    await deps.prisma.applicationChecklist.create({
      data: {
        enrollmentId: createdApplication.id,
        academicStatus: EOSY_RETAINED_OUTCOMES.has(eosyStatus)
          ? "RETAINED"
          : "PROMOTED",
        updatedById: actingUserId,
      },
    });

    existingTargetLearnerIds.add(learnerId);
    summary.createdApplications += 1;
  }

  return summary;
}

export function createSchoolYearAdminController(
  deps: SchoolYearControllerDeps = createSchoolYearControllerDeps(),
) {
  async function createSchoolYear(req: Request, res: Response): Promise<void> {
    const { classOpeningDate, classEndDate, cloneFromId } = req.body;

    const parsedOpeningDate = parseDateInput(classOpeningDate);
    if (!parsedOpeningDate) {
      res.status(400).json({ message: "A valid classOpeningDate is required" });
      return;
    }

    const normalizedOpeningDate =
      deps.normalizeDateToUtcNoon(parsedOpeningDate);
    const openingYear = normalizedOpeningDate.getUTCFullYear();
    const currentManilaYear = getCurrentManilaYear();

    if (
      openingYear < currentManilaYear ||
      openingYear > currentManilaYear + 1
    ) {
      res.status(400).json({
        message: `Class opening year must be within ${currentManilaYear} and ${currentManilaYear + 1}`,
      });
      return;
    }

    const parsedClassEndDate = classEndDate
      ? parseDateInput(classEndDate)
      : null;
    if (classEndDate && !parsedClassEndDate) {
      res.status(400).json({ message: "classEndDate must be a valid date" });
      return;
    }

    const schedule = deps.deriveSchoolYearScheduleFromOpeningDate(
      normalizedOpeningDate,
      parsedClassEndDate
        ? deps.normalizeDateToUtcNoon(parsedClassEndDate)
        : undefined,
    );

    const existing = await deps.prisma.schoolYear.findUnique({
      where: { yearLabel: schedule.yearLabel },
    });
    if (existing) {
      res
        .status(400)
        .json({ message: "A school year with this label already exists" });
      return;
    }

    await deps.prisma.schoolYear.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    const normalizedCloneFromId =
      cloneFromId === null || cloneFromId === undefined
        ? null
        : Number(cloneFromId);

    const year = await deps.prisma.schoolYear.create({
      data: {
        yearLabel: schedule.yearLabel,
        status: "ACTIVE",
        classOpeningDate: schedule.classOpeningDate,
        classEndDate: schedule.classEndDate,
        earlyRegOpenDate: schedule.earlyRegOpenDate,
        earlyRegCloseDate: schedule.earlyRegCloseDate,
        enrollOpenDate: schedule.enrollOpenDate,
        enrollCloseDate: schedule.enrollCloseDate,
        clonedFromId: normalizedCloneFromId,
      },
    });

    await setActiveSchoolYear(deps, year.id);

    if (normalizedCloneFromId) {
      await cloneSchoolYearStructure(deps, normalizedCloneFromId, year.id);
    }

    await ensureDefaultGradeLevels(deps, year.id);

    await deps.auditLog({
      userId: req.user!.userId,
      actionType: "SY_CREATED",
      description: `Created and activated school year "${schedule.yearLabel}"${normalizedCloneFromId ? ` (cloned from ID ${normalizedCloneFromId})` : ""}`,
      subjectType: "SchoolYear",
      recordId: year.id,
      req,
    });

    const full = await deps.prisma.schoolYear.findUnique({
      where: { id: year.id },
      include: {
        gradeLevels: { orderBy: { displayOrder: "asc" } },
        _count: {
          select: {
            earlyRegistrationApplications: true,
            enrollmentApplications: true,
            enrollmentRecords: true,
          },
        },
      },
    });

    res.status(201).json({ year: full });
  }

  async function rolloverSchoolYear(
    req: Request,
    res: Response,
  ): Promise<void> {
    const {
      classOpeningDate,
      classEndDate,
      cloneStructure = true,
      carryOverLearners = true,
    } = req.body;

    const parsedOpeningDate = parseDateInput(classOpeningDate);
    if (!parsedOpeningDate) {
      res.status(400).json({ message: "A valid classOpeningDate is required" });
      return;
    }

    const normalizedOpeningDate =
      deps.normalizeDateToUtcNoon(parsedOpeningDate);
    const openingYear = normalizedOpeningDate.getUTCFullYear();
    const currentManilaYear = getCurrentManilaYear();

    if (
      openingYear < currentManilaYear ||
      openingYear > currentManilaYear + 1
    ) {
      res.status(400).json({
        message: `Class opening year must be within ${currentManilaYear} and ${currentManilaYear + 1}`,
      });
      return;
    }

    const parsedClassEndDate = classEndDate
      ? parseDateInput(classEndDate)
      : null;
    if (classEndDate && !parsedClassEndDate) {
      res.status(400).json({ message: "classEndDate must be a valid date" });
      return;
    }

    const schedule = deps.deriveSchoolYearScheduleFromOpeningDate(
      normalizedOpeningDate,
      parsedClassEndDate
        ? deps.normalizeDateToUtcNoon(parsedClassEndDate)
        : undefined,
    );

    const existingTargetYear = await deps.prisma.schoolYear.findUnique({
      where: { yearLabel: schedule.yearLabel },
      select: { id: true },
    });
    if (existingTargetYear) {
      res
        .status(400)
        .json({ message: "A school year with this label already exists" });
      return;
    }

    const schoolSetting = await deps.prisma.schoolSetting.findFirst({
      select: {
        activeSchoolYearId: true,
      },
    });

    let activeYear = null;
    if (schoolSetting?.activeSchoolYearId) {
      activeYear = await deps.prisma.schoolYear.findUnique({
        where: { id: schoolSetting.activeSchoolYearId },
        select: { id: true, yearLabel: true, isEosyFinalized: true },
      });
    }

    if (!activeYear) {
      activeYear = await deps.prisma.schoolYear.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { id: true, yearLabel: true, isEosyFinalized: true },
      });
    }

    if (!activeYear) {
      res.status(422).json({
        message:
          "No active school year found. Use School Year initialization instead.",
      });
      return;
    }

    if (!activeYear.isEosyFinalized) {
      res.status(422).json({
        message:
          "Active school year must be EOSY-finalized before rollover can proceed.",
      });
      return;
    }

    await deps.prisma.schoolYear.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });

    const newYear = await deps.prisma.schoolYear.create({
      data: {
        yearLabel: schedule.yearLabel,
        status: "ACTIVE",
        classOpeningDate: schedule.classOpeningDate,
        classEndDate: schedule.classEndDate,
        earlyRegOpenDate: schedule.earlyRegOpenDate,
        earlyRegCloseDate: schedule.earlyRegCloseDate,
        enrollOpenDate: schedule.enrollOpenDate,
        enrollCloseDate: schedule.enrollCloseDate,
        clonedFromId: activeYear.id,
      },
    });

    await setActiveSchoolYear(deps, newYear.id);

    if (cloneStructure) {
      await cloneSchoolYearStructure(deps, activeYear.id, newYear.id);
    }

    await ensureDefaultGradeLevels(deps, newYear.id);

    const rolloverSummary = carryOverLearners
      ? await carryOverEligibleLearners(
          deps,
          activeYear.id,
          newYear.id,
          parseStartYearFromLabel(schedule.yearLabel),
          req.user?.userId ?? null,
        )
      : null;

    await deps.auditLog({
      userId: req.user!.userId,
      actionType: "SY_ROLLOVER_COMPLETED",
      description: `Rolled over school year from "${activeYear.yearLabel}" to "${schedule.yearLabel}"${carryOverLearners && rolloverSummary ? ` with ${rolloverSummary.createdApplications} carried learner application(s)` : ""}`,
      subjectType: "SchoolYear",
      recordId: newYear.id,
      req,
    });

    const full = await deps.prisma.schoolYear.findUnique({
      where: { id: newYear.id },
      include: {
        gradeLevels: { orderBy: { displayOrder: "asc" } },
        _count: {
          select: {
            earlyRegistrationApplications: true,
            enrollmentApplications: true,
            enrollmentRecords: true,
          },
        },
      },
    });

    res.status(201).json({
      year: full,
      rolloverFrom: {
        id: activeYear.id,
        yearLabel: activeYear.yearLabel,
      },
      rolloverSummary,
    });
  }

  async function toggleOverride(req: Request, res: Response): Promise<void> {
    const id = parseSchoolYearId(req);
    const { isManualOverrideOpen } = req.body;

    const updated = await deps.prisma.schoolYear.update({
      where: { id },
      data: { isManualOverrideOpen },
    });

    await deps.auditLog({
      userId: req.user!.userId,
      actionType: "SCHOOL_YEAR_OVERRIDE_TOGGLED",
      description: `Manual override set to ${isManualOverrideOpen ? "OPEN" : "OFF"} for year "${updated.yearLabel}"`,
      subjectType: "SchoolYear",
      recordId: id,
      req,
    });

    res.json({ year: updated });
  }

  async function updateDates(req: Request, res: Response): Promise<void> {
    const id = parseSchoolYearId(req);
    const {
      earlyRegOpenDate,
      earlyRegCloseDate,
      enrollOpenDate,
      enrollCloseDate,
    } = req.body;

    const updated = await deps.prisma.schoolYear.update({
      where: { id },
      data: {
        ...(earlyRegOpenDate !== undefined
          ? {
              earlyRegOpenDate: earlyRegOpenDate
                ? deps.normalizeDateToUtcNoon(new Date(earlyRegOpenDate))
                : null,
            }
          : {}),
        ...(earlyRegCloseDate !== undefined
          ? {
              earlyRegCloseDate: earlyRegCloseDate
                ? deps.normalizeDateToUtcNoon(new Date(earlyRegCloseDate))
                : null,
            }
          : {}),
        ...(enrollOpenDate !== undefined
          ? {
              enrollOpenDate: enrollOpenDate
                ? deps.normalizeDateToUtcNoon(new Date(enrollOpenDate))
                : null,
            }
          : {}),
        ...(enrollCloseDate !== undefined
          ? {
              enrollCloseDate: enrollCloseDate
                ? deps.normalizeDateToUtcNoon(new Date(enrollCloseDate))
                : null,
            }
          : {}),
      },
    });

    await deps.auditLog({
      userId: req.user!.userId,
      actionType: "ENROLLMENT_DATES_UPDATED",
      description: `Updated enrollment dates for "${updated.yearLabel}"`,
      subjectType: "SchoolYear",
      recordId: id,
      req,
    });

    res.json({ year: updated });
  }

  async function updateSchoolYear(req: Request, res: Response): Promise<void> {
    const id = parseSchoolYearId(req);
    const { yearLabel } = req.body;

    const year = await deps.prisma.schoolYear.findUnique({ where: { id } });
    if (!year) {
      res.status(404).json({ message: "School year not found" });
      return;
    }

    if (year.status === "ARCHIVED") {
      res.status(400).json({ message: "Cannot edit an archived school year" });
      return;
    }

    const updated = await deps.prisma.schoolYear.update({
      where: { id },
      data: {
        ...(yearLabel ? { yearLabel } : {}),
      },
    });

    await deps.auditLog({
      userId: req.user!.userId,
      actionType: "SY_UPDATED",
      description: `Updated school year "${updated.yearLabel}"`,
      subjectType: "SchoolYear",
      recordId: id,
      req,
    });

    res.json({ year: updated });
  }

  return {
    createSchoolYear,
    rolloverSchoolYear,
    toggleOverride,
    updateDates,
    updateSchoolYear,
  };
}

const schoolYearAdminController = createSchoolYearAdminController();

export const {
  createSchoolYear,
  rolloverSchoolYear,
  toggleOverride,
  updateDates,
  updateSchoolYear,
} = schoolYearAdminController;
