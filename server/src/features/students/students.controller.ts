import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toLegacyStatus(status: string | null, statusV2: string | null): string {
  if (statusV2 === "LINKED" || status === "LINKED") return "ENROLLED";
  if (statusV2) return statusV2;
  return status || "SUBMITTED";
}

function buildFullName(lastName: string, firstName: string, middleName?: string | null) {
  return `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`;
}

export async function getStudents(req: Request, res: Response): Promise<void> {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 15);
  const skip = (page - 1) * limit;

  const schoolYearId = Number.parseInt(String(req.query.schoolYearId ?? ""), 10);
  if (!Number.isInteger(schoolYearId) || schoolYearId <= 0) {
    res.status(400).json({ message: "schoolYearId is required" });
    return;
  }

  const search = String(req.query.search ?? "").trim();
  const gradeLevelId = Number.parseInt(String(req.query.gradeLevelId ?? ""), 10);
  const statusFilter = String(req.query.status ?? "").trim().toUpperCase();

  const where: Record<string, unknown> = { schoolYearId };

  if (Number.isInteger(gradeLevelId) && gradeLevelId > 0) {
    where.gradeLevelIdV2 = gradeLevelId;
  }

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "ENROLLED") {
      where.OR = [{ status: "LINKED" }, { statusV2: "LINKED" }];
    } else {
      where.OR = [{ status: statusFilter }, { statusV2: statusFilter }];
    }
  }

  if (search) {
    const searchFilter = {
      OR: [
        { registrant: { lrn: { contains: search, mode: "insensitive" as const } } },
        {
          registrant: {
            firstName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          registrant: {
            lastName: { contains: search, mode: "insensitive" as const },
          },
        },
      ],
    };

    where.AND = Array.isArray(where.AND)
      ? [...(where.AND as unknown[]), searchFilter]
      : [searchFilter];
  }

  const [total, rows] = await Promise.all([
    prisma.earlyRegistration.count({ where }),
    prisma.earlyRegistration.findMany({
      where,
      include: {
        registrant: true,
        gradeLevelV2: true,
      },
      orderBy: { submittedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const students = rows.map((row) => ({
    id: row.id,
    lrn: row.registrant.lrn || "",
    fullName: buildFullName(
      row.registrant.lastName,
      row.registrant.firstName,
      row.registrant.middleName,
    ),
    firstName: row.registrant.firstName,
    lastName: row.registrant.lastName,
    middleName: row.registrant.middleName,
    suffix: row.registrant.extensionName,
    sex: row.registrant.sex,
    birthDate: row.registrant.birthdate,
    address: `${row.registrant.barangay}, ${row.registrant.cityMunicipality}, ${row.registrant.province}`,
    parentGuardianName: "N/A",
    parentGuardianContact: row.contactNumber,
    emailAddress: row.email || "",
    trackingNumber: `ER-${row.schoolYearId}-${String(row.id).padStart(6, "0")}`,
    status: toLegacyStatus(row.status, row.statusV2),
    gradeLevel:
      row.gradeLevelV2?.name ||
      `Grade ${String(row.gradeLevel).replace(/^GRADE[_\s-]*/i, "")}`,
    gradeLevelId: row.gradeLevelIdV2 || 0,
    section: null,
    sectionId: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  res.json({
    students,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const id = parsePositiveInt(req.params.id, 0);
  if (!id) {
    res.status(400).json({ message: "Invalid student id" });
    return;
  }

  const row = await prisma.earlyRegistration.findUnique({
    where: { id },
    include: {
      registrant: { include: { guardians: true } },
      gradeLevelV2: true,
      schoolYear: true,
    },
  });

  if (!row) {
    res.status(404).json({ message: "Student not found" });
    return;
  }

  const guardians = row.registrant.guardians;
  const mother = guardians.find((g) => g.relationship === "MOTHER");
  const father = guardians.find((g) => g.relationship === "FATHER");
  const guardian = guardians.find((g) => g.relationship === "GUARDIAN");

  res.json({
    student: {
      id: row.id,
      studentPhoto: null,
      lrn: row.registrant.lrn,
      lastName: row.registrant.lastName,
      firstName: row.registrant.firstName,
      middleName: row.registrant.middleName,
      suffix: row.registrant.extensionName,
      birthDate: row.registrant.birthdate,
      sex: row.registrant.sex,
      placeOfBirth: null,
      religion: row.registrant.religion,
      motherTongue: null,
      currentAddress: {
        houseNo: row.registrant.houseNoStreet,
        street: row.registrant.sitio,
        barangay: row.registrant.barangay,
        cityMunicipality: row.registrant.cityMunicipality,
        province: row.registrant.province,
      },
      permanentAddress: null,
      motherName: mother || null,
      fatherName: father || null,
      guardianInfo: guardian || null,
      emailAddress: row.email,
      trackingNumber: `ER-${row.schoolYearId}-${String(row.id).padStart(6, "0")}`,
      status: toLegacyStatus(row.status, row.statusV2),
      rejectionReason: null,
      gradeLevel: {
        id: row.gradeLevelV2?.id || 0,
        name:
          row.gradeLevelV2?.name ||
          `Grade ${String(row.gradeLevel).replace(/^GRADE[_\s-]*/i, "")}`,
      },
      schoolYear: { id: row.schoolYear.id, yearLabel: row.schoolYear.yearLabel },
      enrollment: null,
      healthRecords: [],
      assessments: [],
      programDetail: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
}

function notAvailable(res: Response, action: string): void {
  res.status(410).json({
    message: `${action} is unavailable after legacy applicant stack removal.`,
  });
}

export async function updateStudent(_req: Request, res: Response): Promise<void> {
  notAvailable(res, "Student profile update");
}

export async function getHealthRecords(
  _req: Request,
  res: Response,
): Promise<void> {
  notAvailable(res, "Health records");
}

export async function addHealthRecord(
  _req: Request,
  res: Response,
): Promise<void> {
  notAvailable(res, "Health record creation");
}

export async function updateHealthRecord(
  _req: Request,
  res: Response,
): Promise<void> {
  notAvailable(res, "Health record update");
}

export async function resetPortalPin(
  _req: Request,
  res: Response,
): Promise<void> {
  notAvailable(res, "Portal PIN reset");
}
