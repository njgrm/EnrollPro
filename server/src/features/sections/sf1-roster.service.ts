import ExcelJS from "exceljs";
import type {
  Sf1ImportCommitInput,
  Sf1ImportCommitResponse,
  Sf1ImportIssueCode,
  Sf1ImportPreviewResponse,
  Sf1ImportPreviewRow,
} from "@enrollpro/shared";
import { prisma } from "../../lib/prisma.js";
import {
  ApplicantType,
  EosyStatus,
  Prisma,
  SectioningMethod,
  Sex,
} from "../../generated/prisma/index.js";
import { ensureLearnerUserAccount } from "../learner/learner.service.js";

interface SectionContext {
  id: number;
  name: string;
  gradeLevelId: number;
  gradeLevelName: string;
  schoolYearId: number;
  programType: ApplicantType;
  maxCapacity: number;
}

interface ParsedSf1Row {
  rowNumber: number;
  genderGroup: Sex | null;
  lrn: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  extensionName: string | null;
  sex: Sex | null;
  birthdate: string | null;
  motherTongue: string | null;
  ipGroupName: string | null;
  religion: string | null;
  houseNoStreet: string | null;
  barangay: string | null;
  cityMunicipality: string | null;
  province: string | null;
  fatherName: string | null;
  motherName: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  contactNumber: string | null;
}

interface ExistingLearnerIndex {
  learnerId: number | null;
  sectionId: number | null;
  sectionName: string | null;
}

const INACTIVE_EOSY_STATUSES: EosyStatus[] = ["TRANSFERRED_OUT", "DROPPED_OUT"];

const ACTIVE_ENROLLMENT_FILTER: Prisma.EnrollmentRecordWhereInput = {
  OR: [
    { eosyStatus: { equals: null } },
    { eosyStatus: { notIn: INACTIVE_EOSY_STATUSES } },
  ],
};

const REQUIRED_ROW_ISSUES: Array<{
  code: Sf1ImportIssueCode;
  message: string;
}> = [
  { code: "INVALID_LRN", message: "LRN must be exactly 12 numeric digits." },
  { code: "MISSING_NAME", message: "Learner name is missing or unreadable." },
  { code: "MISSING_BIRTHDATE", message: "Birthdate is missing or unreadable." },
  { code: "MISSING_SEX", message: "Sex is missing or unreadable." },
];

function cleanText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

function upperText(value: string | null | undefined): string | null {
  return cleanText(value)?.toUpperCase() ?? null;
}

function safeCellText(cell: ExcelJS.Cell | null | undefined): string | null {
  if (!cell) return null;
  try {
    const val = cell.value;
    if (val === null || val === undefined) return null;
    if (typeof val === "string") return cleanText(val);
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "object") {
      if ("richText" in val && Array.isArray((val as { richText: Array<{ text?: string }> }).richText)) {
        const text = (val as { richText: Array<{ text?: string }> }).richText
          .map((r) => r.text || "")
          .join("");
        return cleanText(text);
      }
      if ("result" in val) {
        const res = (val as { result: unknown }).result;
        if (res === null || res === undefined) return null;
        if (typeof res === "string") return cleanText(res);
        if (typeof res === "number" || typeof res === "boolean") return String(res);
        if (res instanceof Date) return res.toISOString();
      }
      if ("text" in val && typeof (val as { text: unknown }).text === "string") {
        return cleanText((val as { text: string }).text);
      }
    }
    return cleanText(cell.text);
  } catch {
    return null;
  }
}

function cellText(row: ExcelJS.Row, column: number): string | null {
  return safeCellText(row.getCell(column));
}

function cellRawText(row: ExcelJS.Row, column: number): string | null {
  try {
    const cell = row.getCell(column);
    const value = cell.value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "number") return String(value);
    return safeCellText(cell);
  } catch {
    return null;
  }
}

function normalizeLrn(value: string | null): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length === 12 ? digits : null;
}

function findLrnColumn(row: ExcelJS.Row): number | null {
  for (let column = 1; column <= 24; column += 1) {
    const lrn = normalizeLrn(cellRawText(row, column));
    if (lrn) return column;
  }
  return null;
}

function parseSex(value: string | null, fallback: Sex | null): Sex | null {
  const text = upperText(value);
  if (!text) return fallback;
  if (text === "M" || text.includes("MALE")) return "MALE";
  if (text === "F" || text.includes("FEMALE")) return "FEMALE";
  return fallback;
}

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

function parseDateCell(row: ExcelJS.Row, column: number): string | null {
  const cell = row.getCell(column);
  const value = cell.value;
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = excelSerialToDate(value);
  } else {
    const text = cellText(row, column);
    if (text) {
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseName(value: string | null): {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  extensionName: string | null;
} {
  const text = cleanText(value);
  if (!text) {
    return { firstName: null, lastName: null, middleName: null, extensionName: null };
  }

  const suffixMatch = text.match(/\b(JR\.?|SR\.?|I{2,3}|IV|V)\b$/i);
  const extensionName = suffixMatch ? suffixMatch[0].replace(/\.$/, "").toUpperCase() : null;
  const nameWithoutSuffix = suffixMatch
    ? cleanText(text.slice(0, suffixMatch.index))
    : text;

  if (nameWithoutSuffix?.includes(",")) {
    const [lastNameRaw, restRaw] = nameWithoutSuffix.split(",", 2);
    const restParts = cleanText(restRaw)?.split(" ").filter(Boolean) ?? [];
    return {
      lastName: upperText(lastNameRaw),
      firstName: upperText(restParts[0] ?? null),
      middleName: upperText(restParts.slice(1).join(" ") || null),
      extensionName,
    };
  }

  const parts = nameWithoutSuffix?.split(" ").filter(Boolean) ?? [];
  if (parts.length < 2) {
    return {
      firstName: upperText(nameWithoutSuffix),
      lastName: null,
      middleName: null,
      extensionName,
    };
  }

  return {
    firstName: upperText(parts.slice(0, -1).join(" ")),
    lastName: upperText(parts[parts.length - 1] ?? null),
    middleName: null,
    extensionName,
  };
}

function parseGenderAnchor(row: ExcelJS.Row): Sex | null {
  const values: string[] = [];
  for (let column = 1; column <= 10; column += 1) {
    const text = upperText(cellText(row, column));
    if (text) values.push(text);
  }
  const line = values.join(" ");
  if (/\bFEMALE\b|\bGIRL/.test(line)) return "FEMALE";
  if (/\bMALE\b|\bBOY/.test(line)) return "MALE";
  return null;
}

function nextNonEmptyCell(row: ExcelJS.Row, startColumn: number): string | null {
  for (let column = startColumn; column <= 24; column += 1) {
    const value = cellText(row, column);
    if (value) return value;
  }
  return null;
}

function parseSf1LearnerRow(row: ExcelJS.Row, genderGroup: Sex | null): ParsedSf1Row | null {
  const lrnColumn = findLrnColumn(row);
  if (!lrnColumn) return null;

  const rawLrn = normalizeLrn(cellRawText(row, lrnColumn));
  if (!rawLrn) return null;

  const fullName =
    cleanText(cellText(row, 3)) ||
    cleanText(cellText(row, 2)) ||
    nextNonEmptyCell(row, lrnColumn + 1);
  if (!fullName) return null;

  if (/name of learner|learner name|last name|first name|total male|total female|combined/i.test(fullName)) {
    return null;
  }

  const parsedName = parseName(fullName);
  const sex = parseSex(cellText(row, 7) || cellText(row, 5), genderGroup);

  const birthdate =
    parseDateCell(row, 8) ||
    parseDateCell(row, 6) ||
    parseDateCell(row, lrnColumn + 2);

  return {
    rowNumber: row.number,
    genderGroup,
    lrn: rawLrn,
    fullName,
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    middleName: parsedName.middleName,
    extensionName: parsedName.extensionName,
    sex,
    birthdate,
    motherTongue: upperText(cellText(row, 12)) || upperText(cellText(row, 8)),
    ipGroupName: upperText(cellText(row, 14)) || upperText(cellText(row, 9)),
    religion: upperText(cellText(row, 15)) || upperText(cellText(row, 10)),
    houseNoStreet: upperText(cellText(row, 16)) || upperText(cellText(row, 11)),
    barangay: upperText(cellText(row, 18)) || upperText(cellText(row, 12)),
    cityMunicipality: upperText(cellText(row, 21)) || upperText(cellText(row, 13)),
    province: upperText(cellText(row, 23)) || upperText(cellText(row, 14)),
    fatherName: upperText(cellText(row, 28)) || upperText(cellText(row, 15)),
    motherName: upperText(cellText(row, 32)) || upperText(cellText(row, 16)),
    guardianName: upperText(cellText(row, 37)) || upperText(cellText(row, 17)),
    guardianRelationship: upperText(cellText(row, 41)) || upperText(cellText(row, 18)),
    contactNumber: cellText(row, 42) || cellText(row, 19),
  };
}

async function getSectionContext(sectionId: number): Promise<SectionContext | null> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { gradeLevel: true },
  });
  if (!section) return null;
  return {
    id: section.id,
    name: section.name,
    gradeLevelId: section.gradeLevelId,
    gradeLevelName: section.gradeLevel.name,
    schoolYearId: section.schoolYearId,
    programType: section.programType,
    maxCapacity: section.maxCapacity,
  };
}

async function buildExistingLearnerIndex(
  rows: ParsedSf1Row[],
  schoolYearId: number,
): Promise<Map<string, ExistingLearnerIndex>> {
  const lrns = rows
    .map((row) => row.lrn)
    .filter((lrn): lrn is string => Boolean(lrn));

  if (lrns.length === 0) return new Map();

  const learners = await prisma.learner.findMany({
    where: { lrn: { in: Array.from(new Set(lrns)) } },
    select: {
      id: true,
      lrn: true,
    },
  });

  const activeRecords = await prisma.enrollmentRecord.findMany({
    where: {
      learnerId: { in: learners.map((learner) => learner.id) },
      schoolYearId,
      ...ACTIVE_ENROLLMENT_FILTER,
    },
    select: {
      learnerId: true,
      sectionId: true,
      section: { select: { name: true } },
    },
  });
  const activeRecordByLearnerId = new Map(
    activeRecords.map((record) => [record.learnerId, record]),
  );

  return new Map(
    learners
      .filter((learner) => learner.lrn)
      .map((learner) => {
        const activeRecord = activeRecordByLearnerId.get(learner.id);
        return [
          learner.lrn as string,
          {
            learnerId: learner.id,
            sectionId: activeRecord?.sectionId ?? null,
            sectionName: activeRecord?.section.name ?? null,
          },
        ];
      }),
  );
}

function issueMessage(code: Sf1ImportIssueCode, existingSectionName?: string | null): string {
  if (code === "CROSS_SECTION_CONFLICT") {
    return `LRN is already enrolled in ${existingSectionName ?? "another section"} for this school year.`;
  }
  if (code === "ALREADY_IN_SECTION") return "Learner is already listed in this section.";
  return REQUIRED_ROW_ISSUES.find((issue) => issue.code === code)?.message ?? "Review this row.";
}

function toPreviewRow(
  row: ParsedSf1Row,
  section: SectionContext,
  seenLrns: Set<string>,
  existingLearners: Map<string, ExistingLearnerIndex>,
): Sf1ImportPreviewRow {
  const issues: Sf1ImportIssueCode[] = [];
  const existing = row.lrn ? existingLearners.get(row.lrn) ?? null : null;
  const guardian = splitGuardianName(row.guardianName);

  if (!row.lrn) issues.push("INVALID_LRN");
  else if (seenLrns.has(row.lrn)) issues.push("DUPLICATE_IN_FILE");
  if (!row.firstName || !row.lastName) issues.push("MISSING_NAME");
  if (!row.birthdate) issues.push("MISSING_BIRTHDATE");
  if (!row.sex) issues.push("MISSING_SEX");
  if (existing?.sectionId && existing.sectionId !== section.id) {
    issues.push("CROSS_SECTION_CONFLICT");
  }
  if (existing?.sectionId === section.id) {
    issues.push("ALREADY_IN_SECTION");
  }

  if (row.lrn) seenLrns.add(row.lrn);

  const isBlocked = issues.length > 0;
  const matchStatus = isBlocked
    ? "BLOCKED"
    : existing?.learnerId
      ? "VALID_EXISTING_LEARNER"
      : "VALID_NEW_LEARNER";

  return {
    rowNumber: row.rowNumber,
    genderGroup: row.genderGroup,
    lrn: row.lrn,
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    extensionName: row.extensionName,
    sex: row.sex,
    birthdate: row.birthdate,
    motherTongue: row.motherTongue,
    ipGroupName: row.ipGroupName,
    religion: row.religion,
    houseNoStreet: row.houseNoStreet,
    barangay: row.barangay,
    cityMunicipality: row.cityMunicipality,
    province: row.province,
    fatherName: row.fatherName,
    motherName: row.motherName,
    guardianFirstName: guardian?.firstName ?? null,
    guardianMiddleName: guardian?.middleName ?? null,
    guardianLastName: guardian?.lastName ?? null,
    guardianRelationship: row.guardianRelationship,
    contactNumber: row.contactNumber,
    matchStatus,
    existingLearnerId: existing?.learnerId ?? null,
    existingSectionName: existing?.sectionName ?? null,
    issues,
    issueMessages: issues.map((issue) => issueMessage(issue, existing?.sectionName)),
  };
}

function summarizeRows(rows: Sf1ImportPreviewRow[]): Sf1ImportPreviewResponse["summary"] {
  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.matchStatus !== "BLOCKED").length,
    newLearners: rows.filter((row) => row.matchStatus === "VALID_NEW_LEARNER").length,
    existingLearners: rows.filter((row) => row.matchStatus === "VALID_EXISTING_LEARNER").length,
    duplicateLrnRows: rows.filter((row) => row.issues.includes("DUPLICATE_IN_FILE")).length,
    crossSectionConflicts: rows.filter((row) => row.issues.includes("CROSS_SECTION_CONFLICT")).length,
    blockedRows: rows.filter((row) => row.matchStatus === "BLOCKED").length,
  };
}

export async function previewSf1RosterImport(
  sectionId: number,
  fileBuffer: Uint8Array,
): Promise<Sf1ImportPreviewResponse> {
  const section = await getSectionContext(sectionId);
  if (!section) throw new Error("Section not found.");

  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  ) as ArrayBuffer;
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("SF1 workbook has no worksheet.");

  const parsedRows: ParsedSf1Row[] = [];
  let genderGroup: Sex | null = null;

  worksheet.eachRow((row) => {
    const anchor = parseGenderAnchor(row);
    if (anchor) genderGroup = anchor;
    const parsed = parseSf1LearnerRow(row, genderGroup);
    if (parsed) parsedRows.push(parsed);
  });

  const existingLearners = await buildExistingLearnerIndex(parsedRows, section.schoolYearId);
  const seenLrns = new Set<string>();
  const rows = parsedRows.map((row) =>
    toPreviewRow(row, section, seenLrns, existingLearners),
  );

  return {
    section,
    summary: summarizeRows(rows),
    rows,
  };
}

function parseCommittedBirthdate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid birthdate.");
  return date;
}

function splitGuardianName(value: string | null): {
  firstName: string;
  lastName: string;
  middleName: string | null;
} | null {
  const parsed = parseName(value);
  if (!parsed.firstName || !parsed.lastName) return null;
  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    middleName: parsed.middleName,
  };
}

export async function commitSf1RosterImport({
  sectionId,
  userId,
  input,
}: {
  sectionId: number;
  userId: number;
  input: Sf1ImportCommitInput;
}): Promise<Sf1ImportCommitResponse> {
  const section = await getSectionContext(sectionId);
  if (!section) throw new Error("Section not found.");

  const validRows = input.rows.filter(
    (row) => row.matchStatus !== "BLOCKED" && row.issues.length === 0,
  );
  const learnerIds: number[] = [];
  const skippedRows: Sf1ImportCommitResponse["skippedRows"] = [];
  let createdLearnerCount = 0;
  let reusedLearnerCount = 0;

  for (const row of validRows) {
    const lrn = row.lrn;
    const firstName = row.firstName;
    const lastName = row.lastName;
    const birthdate = row.birthdate;
    const sex = row.sex;

    if (!lrn || !firstName || !lastName || !birthdate || !sex) {
      skippedRows.push({
        rowNumber: row.rowNumber,
        lrn,
        reason: "Required learner information is incomplete.",
      });
      continue;
    }

    try {
      const commitResult = await prisma.$transaction(async (tx) => {
        const existingLearner = await tx.learner.findUnique({
          where: { lrn },
          select: { id: true },
        });
        const activeRecord = existingLearner
          ? await tx.enrollmentRecord.findFirst({
              where: {
                learnerId: existingLearner.id,
                schoolYearId: section.schoolYearId,
                ...ACTIVE_ENROLLMENT_FILTER,
              },
              select: { sectionId: true },
            })
          : null;

        if (activeRecord?.sectionId === section.id) {
          throw new Error("Learner is already listed in this section.");
        }
        if (activeRecord?.sectionId) {
          throw new Error("Learner is already enrolled in another section.");
        }

        const learner = existingLearner
          ? await tx.learner.update({
              where: { id: existingLearner.id },
              data: {
                firstName,
                lastName,
                middleName: row.middleName,
                extensionName: row.extensionName,
                birthdate: parseCommittedBirthdate(birthdate),
                sex,
                motherTongue: row.motherTongue,
                religion: row.religion,
                isIpCommunity: Boolean(row.ipGroupName),
                ipGroupName: row.ipGroupName,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                lrn: true,
                sex: true,
              },
            })
          : await tx.learner.create({
              data: {
                lrn,
                firstName,
                lastName,
                middleName: row.middleName,
                extensionName: row.extensionName,
                birthdate: parseCommittedBirthdate(birthdate),
                sex,
                motherTongue: row.motherTongue,
                religion: row.religion,
                isIpCommunity: Boolean(row.ipGroupName),
                ipGroupName: row.ipGroupName,
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                lrn: true,
                sex: true,
              },
            });

        const application = await tx.enrollmentApplication.upsert({
          where: {
            uq_enrollment_learner_sy: {
              learnerId: learner.id,
              schoolYearId: section.schoolYearId,
            },
          },
          update: {
            gradeLevelId: section.gradeLevelId,
            applicantType: section.programType,
            assignedProgram: section.programType,
            learnerType: "NEW_ENROLLEE",
            admissionChannel: "F2F",
            status: "OFFICIALLY_ENROLLED",
            contactNumber: row.contactNumber,
            guardianFirstName: row.guardianFirstName,
            guardianMiddleName: row.guardianMiddleName,
            guardianLastName: row.guardianLastName,
            guardianRelationship: row.guardianRelationship,
            isPrivacyConsentGiven: true,
            encodedById: userId,
          },
          create: {
            learnerId: learner.id,
            schoolYearId: section.schoolYearId,
            gradeLevelId: section.gradeLevelId,
            applicantType: section.programType,
            assignedProgram: section.programType,
            learnerType: "NEW_ENROLLEE",
            admissionChannel: "F2F",
            status: "OFFICIALLY_ENROLLED",
            learningModalities: ["FACE_TO_FACE"],
            contactNumber: row.contactNumber,
            guardianFirstName: row.guardianFirstName,
            guardianMiddleName: row.guardianMiddleName,
            guardianLastName: row.guardianLastName,
            guardianRelationship: row.guardianRelationship,
            isPrivacyConsentGiven: true,
            encodedById: userId,
          },
        });

        await tx.applicationAddress.deleteMany({
          where: { enrollmentId: application.id },
        });
        if (row.houseNoStreet || row.barangay || row.cityMunicipality || row.province) {
          await tx.applicationAddress.create({
            data: {
              enrollmentId: application.id,
              addressType: "CURRENT",
              houseNoStreet: row.houseNoStreet,
              barangay: row.barangay,
              cityMunicipality: row.cityMunicipality,
              province: row.province,
            },
          });
        }

        await tx.applicationFamilyMember.deleteMany({
          where: { enrollmentId: application.id },
        });
        if (row.guardianFirstName && row.guardianLastName) {
          await tx.applicationFamilyMember.create({
            data: {
              enrollmentId: application.id,
              relationship: "GUARDIAN",
              firstName: row.guardianFirstName,
              lastName: row.guardianLastName,
              middleName: row.guardianMiddleName,
              contactNumber: row.contactNumber,
            },
          });
        }

        await tx.enrollmentRecord.create({
          data: {
            enrollmentApplicationId: application.id,
            learnerId: learner.id,
            sectionId: section.id,
            schoolYearId: section.schoolYearId,
            enrolledById: userId,
            dateSectioned: new Date(),
            enrolledAt: new Date(),
            sectioningMethod: SectioningMethod.INLINE_SLOTTING,
            sf1Remarks: "SF1 roster import",
          },
        });

        await ensureLearnerUserAccount(tx, {
          id: learner.id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          lrn: learner.lrn,
          sex: learner.sex,
        });

        return {
          learnerId: learner.id,
          wasCreated: !existingLearner,
        };
      });

      learnerIds.push(commitResult.learnerId);
      if (commitResult.wasCreated) createdLearnerCount += 1;
      else reusedLearnerCount += 1;
    } catch (error: unknown) {
      skippedRows.push({
        rowNumber: row.rowNumber,
        lrn: row.lrn,
        reason: error instanceof Error ? error.message : "Could not import this learner.",
      });
    }
  }

  return {
    committedCount: learnerIds.length,
    skippedCount: input.rows.length - learnerIds.length,
    createdLearnerCount,
    reusedLearnerCount,
    learnerIds,
    skippedRows,
  };
}

export interface Sf1HeaderMetadata {
  depedSchoolId: string | null;
  division: string | null;
  schoolName: string | null;
  schoolYearLabel: string | null;
  gradeLevelName: string | null;
  sectionName: string | null;
}

export function extractSf1HeaderMetadata(worksheet: ExcelJS.Worksheet): Sf1HeaderMetadata {
  let schoolId = safeCellText(worksheet.getCell("F3"));
  let division = safeCellText(worksheet.getCell("T3"));
  let schoolName = safeCellText(worksheet.getCell("F4"));
  let schoolYearLabel = safeCellText(worksheet.getCell("T4"));
  let gradeLevelName = safeCellText(worksheet.getCell("AE4"));
  let sectionName = safeCellText(worksheet.getCell("AM4"));

  if (!gradeLevelName || !sectionName) {
    for (let r = 1; r <= 6; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= 46; c++) {
        const val = safeCellText(row.getCell(c));
        if (!val) continue;

        if (!gradeLevelName) {
          const match = val.match(/Grade\s*(7|8|9|10)/i);
          if (match) {
            gradeLevelName = `Grade ${match[1]}`;
          } else if (/^(Grade\s*)?[7-9]|10$/i.test(val)) {
            const digits = val.replace(/\D/g, "");
            if (["7", "8", "9", "10"].includes(digits)) {
              gradeLevelName = `Grade ${digits}`;
            }
          }
        }

        if (!sectionName) {
          const secMatch = val.match(/Section[:\s]+([A-Za-z0-9_-]+)/i);
          if (secMatch) {
            sectionName = secMatch[1];
          }
        }
      }
    }
  }

  if (gradeLevelName) {
    const digits = gradeLevelName.replace(/\D/g, "");
    if (["7", "8", "9", "10"].includes(digits)) {
      gradeLevelName = `Grade ${digits}`;
    }
  }

  return {
    depedSchoolId: schoolId,
    division,
    schoolName,
    schoolYearLabel,
    gradeLevelName,
    sectionName,
  };
}

export interface BulkImportSf1Result {
  success: boolean;
  totalParsed: number;
  importedCount: number;
  gradeLevelName: string;
  sectionName: string;
  sectionId: number;
  message: string;
}

export async function bulkImportSf1File({
  fileBuffer,
  userId,
  targetSectionId,
  schoolYearId,
}: {
  fileBuffer: Uint8Array;
  userId: number;
  targetSectionId?: number | null;
  schoolYearId?: number | null;
}): Promise<BulkImportSf1Result> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  ) as ArrayBuffer;
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("SF1 workbook has no worksheet.");

  let effectiveSchoolYearId = schoolYearId;
  if (!effectiveSchoolYearId) {
    const settings = await prisma.schoolSetting.findFirst({
      select: { activeSchoolYearId: true },
    });
    effectiveSchoolYearId = settings?.activeSchoolYearId ?? null;
  }
  if (!effectiveSchoolYearId) {
    const activeSy = await prisma.schoolYear.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    effectiveSchoolYearId = activeSy?.id ?? null;
  }
  if (!effectiveSchoolYearId) {
    throw new Error("No active school year found. Please configure a school year first.");
  }

  const headerMeta = extractSf1HeaderMetadata(worksheet);

  let section: SectionContext | null = null;
  if (targetSectionId) {
    section = await getSectionContext(targetSectionId);
  }

  if (!section) {
    const gradeSearch = headerMeta.gradeLevelName || "Grade 7";
    const gradeNum = gradeSearch.replace(/\D/g, "") || "7";
    const gradeLevel = await prisma.gradeLevel.findFirst({
      where: {
        OR: [
          { name: { contains: gradeNum } },
          { name: { equals: gradeSearch, mode: "insensitive" } },
        ],
      },
    });

    if (!gradeLevel) {
      throw new Error(`Grade level ${gradeSearch} not found in the system.`);
    }

    const sectionNameRaw = headerMeta.sectionName || "SECTION 1";
    const sectionNameClean = sectionNameRaw.toUpperCase().trim();

    let existingSection = await prisma.section.findFirst({
      where: {
        gradeLevelId: gradeLevel.id,
        schoolYearId: effectiveSchoolYearId,
        name: { equals: sectionNameClean, mode: "insensitive" },
      },
      include: { gradeLevel: true },
    });

    if (!existingSection) {
      existingSection = await prisma.section.create({
        data: {
          name: sectionNameClean,
          gradeLevelId: gradeLevel.id,
          schoolYearId: effectiveSchoolYearId,
          maxCapacity: 40,
          programType: ApplicantType.REGULAR,
        },
        include: { gradeLevel: true },
      });
    }

    section = {
      id: existingSection.id,
      name: existingSection.name,
      gradeLevelId: existingSection.gradeLevelId,
      gradeLevelName: existingSection.gradeLevel.name,
      schoolYearId: existingSection.schoolYearId,
      programType: existingSection.programType,
      maxCapacity: existingSection.maxCapacity,
    };
  }

  const parsedRows: ParsedSf1Row[] = [];
  let genderGroup: Sex | null = null;

  worksheet.eachRow((row) => {
    const anchor = parseGenderAnchor(row);
    if (anchor) genderGroup = anchor;
    const parsed = parseSf1LearnerRow(row, genderGroup);
    if (parsed && parsed.lrn && parsed.fullName) {
      parsedRows.push(parsed);
    }
  });

  if (parsedRows.length === 0) {
    throw new Error(
      "No learner records with valid 12-digit LRN found in the SF1 file. Please ensure learner rows have valid LRNs and names.",
    );
  }

  let committedCount = 0;
  const seenLrns = new Set<string>();

  for (const row of parsedRows) {
    const lrn = row.lrn;
    if (!lrn || seenLrns.has(lrn)) continue;
    seenLrns.add(lrn);

    const firstName = row.firstName || row.fullName || "Learner";
    const lastName = row.lastName || "Unknown";
    const sex = row.sex || "FEMALE";
    const birthdate = row.birthdate ? parseCommittedBirthdate(row.birthdate) : new Date("2010-01-01");
    const guardian = splitGuardianName(row.guardianName);

    await prisma.$transaction(async (tx) => {
      // 1. Dual Insertion Part A: Global Learner Directory (Learner table)
      const existingLearner = await tx.learner.findUnique({
        where: { lrn },
        select: { id: true },
      });

      const learner = existingLearner
        ? await tx.learner.update({
            where: { id: existingLearner.id },
            data: {
              firstName,
              lastName,
              middleName: row.middleName,
              extensionName: row.extensionName,
              birthdate,
              sex,
              motherTongue: row.motherTongue,
              religion: row.religion,
              isIpCommunity: Boolean(row.ipGroupName),
              ipGroupName: row.ipGroupName,
            },
            select: { id: true, firstName: true, lastName: true, lrn: true, sex: true, birthdate: true },
          })
        : await tx.learner.create({
            data: {
              lrn,
              firstName,
              lastName,
              middleName: row.middleName,
              extensionName: row.extensionName,
              birthdate,
              sex,
              motherTongue: row.motherTongue,
              religion: row.religion,
              isIpCommunity: Boolean(row.ipGroupName),
              ipGroupName: row.ipGroupName,
            },
            select: { id: true, firstName: true, lastName: true, lrn: true, sex: true, birthdate: true },
          });

      // 2. Dual Insertion Part B: Enrollment Application & Section Assignment
      const application = await tx.enrollmentApplication.upsert({
        where: {
          uq_enrollment_learner_sy: {
            learnerId: learner.id,
            schoolYearId: section.schoolYearId,
          },
        },
        update: {
          gradeLevelId: section.gradeLevelId,
          applicantType: section.programType,
          assignedProgram: section.programType,
          learnerType: "NEW_ENROLLEE",
          admissionChannel: "F2F",
          status: "OFFICIALLY_ENROLLED",
          contactNumber: row.contactNumber,
          guardianFirstName: guardian?.firstName,
          guardianMiddleName: guardian?.middleName,
          guardianLastName: guardian?.lastName,
          guardianRelationship: row.guardianRelationship,
          isPrivacyConsentGiven: true,
          encodedById: userId,
        },
        create: {
          learnerId: learner.id,
          schoolYearId: section.schoolYearId,
          gradeLevelId: section.gradeLevelId,
          applicantType: section.programType,
          assignedProgram: section.programType,
          learnerType: "NEW_ENROLLEE",
          admissionChannel: "F2F",
          status: "OFFICIALLY_ENROLLED",
          learningModalities: ["FACE_TO_FACE"],
          contactNumber: row.contactNumber,
          guardianFirstName: guardian?.firstName,
          guardianMiddleName: guardian?.middleName,
          guardianLastName: guardian?.lastName,
          guardianRelationship: row.guardianRelationship,
          isPrivacyConsentGiven: true,
          encodedById: userId,
        },
      });

      if (row.houseNoStreet || row.barangay || row.cityMunicipality || row.province) {
        await tx.applicationAddress.deleteMany({
          where: { enrollmentId: application.id },
        });
        await tx.applicationAddress.create({
          data: {
            enrollmentId: application.id,
            addressType: "CURRENT",
            houseNoStreet: row.houseNoStreet,
            barangay: row.barangay,
            cityMunicipality: row.cityMunicipality,
            province: row.province,
          },
        });
      }

      if (guardian?.firstName && guardian?.lastName) {
        await tx.applicationFamilyMember.deleteMany({
          where: { enrollmentId: application.id },
        });
        await tx.applicationFamilyMember.create({
          data: {
            enrollmentId: application.id,
            relationship: "GUARDIAN",
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            middleName: guardian.middleName,
            contactNumber: row.contactNumber,
          },
        });
      }

      // 3. Upsert EnrollmentRecord linking to Section
      const existingEnrollmentRecord = await tx.enrollmentRecord.findFirst({
        where: {
          learnerId: learner.id,
          schoolYearId: section.schoolYearId,
        },
      });

      if (existingEnrollmentRecord) {
        await tx.enrollmentRecord.update({
          where: { id: existingEnrollmentRecord.id },
          data: {
            sectionId: section.id,
            enrolledById: userId,
            eosyStatus: null,
            dateSectioned: new Date(),
            sectioningMethod: SectioningMethod.INLINE_SLOTTING,
            sf1Remarks: "SF1 bulk import",
          },
        });
      } else {
        await tx.enrollmentRecord.create({
          data: {
            enrollmentApplicationId: application.id,
            learnerId: learner.id,
            sectionId: section.id,
            schoolYearId: section.schoolYearId,
            enrolledById: userId,
            dateSectioned: new Date(),
            enrolledAt: new Date(),
            sectioningMethod: SectioningMethod.INLINE_SLOTTING,
            sf1Remarks: "SF1 bulk import",
          },
        });
      }

      await ensureLearnerUserAccount(tx, {
        id: learner.id,
        firstName: learner.firstName,
        lastName: learner.lastName,
        lrn: learner.lrn,
        sex: learner.sex,
      });
    });

    committedCount++;
  }

  return {
    success: true,
    totalParsed: parsedRows.length,
    importedCount: committedCount,
    gradeLevelName: section.gradeLevelName,
    sectionName: section.name,
    sectionId: section.id,
    message: `Success: ${committedCount} Learners imported into ${section.gradeLevelName} - ${section.name}`,
  };
}
