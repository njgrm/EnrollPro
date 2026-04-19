import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import { auditLog } from "../audit-logs/audit-logs.service.js";

async function getSchoolYearExportLockState(schoolYearId: number) {
  const [schoolYear, totalSections, finalizedSections] = await Promise.all([
    prisma.schoolYear.findUnique({
      where: { id: schoolYearId },
      select: { id: true, yearLabel: true, isEosyFinalized: true },
    }),
    prisma.section.count({
      where: {
        gradeLevel: { schoolYearId },
      },
    }),
    prisma.section.count({
      where: {
        gradeLevel: { schoolYearId },
        isEosyFinalized: true,
      },
    }),
  ]);

  if (!schoolYear) {
    throw new AppError(404, "School year not found.");
  }

  const schoolYearFinalized = schoolYear.isEosyFinalized;
  const canFinalizeSchoolYear =
    totalSections > 0 &&
    finalizedSections === totalSections &&
    !schoolYearFinalized;

  let lockReason: string | null = null;
  if (schoolYearFinalized) {
    lockReason =
      "School year EOSY is finalized. Class reopening and status updates are locked.";
  } else if (totalSections === 0) {
    lockReason =
      "No sections found for this school year. Add sections before school-level finalization.";
  } else if (!canFinalizeSchoolYear) {
    lockReason = `${totalSections - finalizedSections} class(es) still need EOSY finalization before school-level lock.`;
  }

  return {
    schoolYearId: schoolYear.id,
    schoolYearLabel: schoolYear.yearLabel,
    schoolYearFinalized,
    totalSections,
    finalizedSections,
    canFinalizeSchoolYear,
    lockReason,
  };
}

export async function getEosySections(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { schoolYearId } = req.query;
    const sections = await prisma.section.findMany({
      where: {
        gradeLevel: {
          schoolYearId: parseInt(String(schoolYearId)),
        },
      },
      include: {
        gradeLevel: true,
        _count: {
          select: { enrollmentRecords: true },
        },
      },
      orderBy: [{ gradeLevel: { name: "asc" } }, { name: "asc" }],
    });
    res.json({ sections });
  } catch (error) {
    next(error);
  }
}

export async function getSectionRecords(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const sectionId = parseInt(String(id), 10);
    const records = await prisma.enrollmentRecord.findMany({
      where: { sectionId },
      include: {
        enrollmentApplication: {
          include: {
            learner: true,
          },
        },
      },
      orderBy: {
        enrollmentApplication: {
          learner: {
            lastName: "asc",
          },
        },
      },
    });
    res.json({ records });
  } catch (error) {
    next(error);
  }
}

export async function updateEosyRecord(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const recordId = parseInt(String(id), 10);
    const { eosyStatus, dropOutReason, transferOutDate } = req.body;

    const record = await prisma.enrollmentRecord.findUnique({
      where: { id: recordId },
      include: {
        section: {
          include: {
            gradeLevel: {
              select: {
                schoolYear: {
                  select: {
                    isEosyFinalized: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!record) throw new AppError(404, "Enrollment record not found.");
    if (record.section.gradeLevel.schoolYear.isEosyFinalized) {
      throw new AppError(
        422,
        "Cannot update status. School year EOSY is finalized and export lock is active.",
      );
    }
    if (record.section.isEosyFinalized) {
      throw new AppError(
        422,
        "Cannot update status. Section is already finalized.",
      );
    }

    const updated = await prisma.enrollmentRecord.update({
      where: { id: recordId },
      data: {
        eosyStatus: eosyStatus as any,
        dropOutReason: eosyStatus === "DROPPED_OUT" ? dropOutReason : null,
        transferOutDate:
          eosyStatus === "TRANSFERRED_OUT"
            ? transferOutDate
              ? new Date(transferOutDate)
              : null
            : null,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function finalizeSection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const sectionId = parseInt(String(id), 10);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        gradeLevel: {
          select: {
            schoolYear: {
              select: {
                isEosyFinalized: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new AppError(404, "Section not found.");
    }
    if (section.gradeLevel.schoolYear.isEosyFinalized) {
      throw new AppError(
        422,
        "Cannot finalize class. School year EOSY is already finalized.",
      );
    }

    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: { isEosyFinalized: true },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "SECTION_FINALIZED",
      description: `Finalized EOSY for section ${updated.name}`,
      subjectType: "Section",
      recordId: sectionId,
      req,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function reopenSection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const sectionId = parseInt(String(id), 10);

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        gradeLevel: {
          select: {
            schoolYear: {
              select: {
                isEosyFinalized: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new AppError(404, "Section not found.");
    }
    if (section.gradeLevel.schoolYear.isEosyFinalized) {
      throw new AppError(
        422,
        "Cannot reopen class. School year EOSY is finalized and export lock is active.",
      );
    }

    const updated = await prisma.section.update({
      where: { id: sectionId },
      data: { isEosyFinalized: false },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "SECTION_REOPENED",
      description: `Re-opened EOSY for section ${updated.name}`,
      subjectType: "Section",
      recordId: sectionId,
      req,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getSchoolYearExportLock(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const syId = parseInt(String(req.params.schoolYearId), 10);
    if (!Number.isInteger(syId)) {
      throw new AppError(400, "A valid schoolYearId is required.");
    }

    const state = await getSchoolYearExportLockState(syId);
    res.json(state);
  } catch (error) {
    next(error);
  }
}

export async function finalizeSchoolYear(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { schoolYearId } = req.body;
    const syId = parseInt(String(schoolYearId));
    if (!Number.isInteger(syId)) {
      throw new AppError(400, "A valid schoolYearId is required.");
    }

    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id: syId },
      select: { id: true, yearLabel: true, isEosyFinalized: true },
    });

    if (!schoolYear) {
      throw new AppError(404, "School year not found.");
    }
    if (schoolYear.isEosyFinalized) {
      throw new AppError(
        422,
        "School year EOSY is already finalized. Export lock is already active.",
      );
    }

    const totalSections = await prisma.section.count({
      where: {
        gradeLevel: { schoolYearId: syId },
      },
    });
    if (totalSections === 0) {
      throw new AppError(
        422,
        "Cannot finalize school EOSY. No sections were found for this school year.",
      );
    }

    // 1. Check if all sections are finalized
    const unfinalizedSections = await prisma.section.count({
      where: {
        gradeLevel: { schoolYearId: syId },
        isEosyFinalized: false,
      },
    });

    if (unfinalizedSections > 0) {
      throw new AppError(
        422,
        `Cannot finalize school EOSY. There are still ${unfinalizedSections} unfinalized sections.`,
      );
    }

    const updated = await prisma.schoolYear.update({
      where: { id: syId },
      data: { isEosyFinalized: true },
    });

    await auditLog({
      userId: req.user!.userId,
      actionType: "SCHOOL_YEAR_FINALIZED",
      description: `Master Finalized EOSY for school year ${updated.yearLabel}`,
      subjectType: "SchoolYear",
      recordId: syId,
      req,
    });

    const state = await getSchoolYearExportLockState(syId);
    res.json({ schoolYear: updated, exportLock: state });
  } catch (error) {
    next(error);
  }
}
