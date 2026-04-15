import type { Request, Response } from "express";
import {
  createSchoolYearControllerDeps,
  SchoolYearControllerDeps,
} from "../services/school-year-controller.deps.js";

function parseSchoolYearId(req: Request): number {
  return Number.parseInt(String(req.params.id ?? ""), 10);
}

export function createSchoolYearQueryController(
  deps: SchoolYearControllerDeps = createSchoolYearControllerDeps(),
) {
  async function listSchoolYears(_req: Request, res: Response): Promise<void> {
    const years = await deps.prisma.schoolYear.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            gradeLevels: true,
            earlyRegistrationApplications: true,
            enrollmentApplications: true,
            enrollmentRecords: true,
          },
        },
      },
    });

    res.json({ years });
  }

  async function getNextDefaults(req: Request, res: Response): Promise<void> {
    const defaults = deps.deriveNextSchoolYear(new Date());
    res.json(defaults);
  }

  async function getSchoolYear(req: Request, res: Response): Promise<void> {
    const id = parseSchoolYearId(req);
    const year = await deps.prisma.schoolYear.findUnique({
      where: { id },
      include: {
        gradeLevels: {
          orderBy: { displayOrder: "asc" },
          include: {
            sections: {
              include: { _count: { select: { enrollmentRecords: true } } },
            },
          },
        },
        _count: {
          select: {
            earlyRegistrationApplications: true,
            enrollmentApplications: true,
            enrollmentRecords: true,
          },
        },
      },
    });

    if (!year) {
      res.status(404).json({ message: "School year not found" });
      return;
    }

    res.json({ year });
  }

  return {
    listSchoolYears,
    getNextDefaults,
    getSchoolYear,
  };
}

const schoolYearQueryController = createSchoolYearQueryController();

export const { listSchoolYears, getNextDefaults, getSchoolYear } =
  schoolYearQueryController;
