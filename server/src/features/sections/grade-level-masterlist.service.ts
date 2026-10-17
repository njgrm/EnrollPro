import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { SectionAdviserStatus, type EosyStatus } from "../../generated/prisma/index.js";

const INACTIVE_EOSY_STATUSES: EosyStatus[] = ["TRANSFERRED_OUT", "DROPPED_OUT"];

const activeEnrollmentFilter = {
  OR: [
    { eosyStatus: { equals: null } },
    {
      eosyStatus: {
        notIn: INACTIVE_EOSY_STATUSES,
      },
    },
  ],
};

export interface MasterlistLearner {
  no: number;
  lrn: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  middleName: string;
  sex: "MALE" | "FEMALE";
  sectionName: string;
  programType: string;
  programLabel: string;
  programShort: string;
  adviserName: string;
}

export interface SectionMasterlistGroup {
  sectionId: number;
  sectionName: string;
  programType: string;
  programLabel: string;
  programShort: string;
  adviserName: string;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  learners: MasterlistLearner[];
}

export interface GradeLevelMasterlistData {
  schoolName: string;
  depedSchoolId: string;
  division: string;
  gradeLevelName: string;
  gradeLevelId: number;
  yearLabel: string;
  sections: SectionMasterlistGroup[];
  allLearners: MasterlistLearner[];
  summary: {
    total: number;
    totalMale: number;
    totalFemale: number;
    byProgram: Array<{
      programType: string;
      programLabel: string;
      programShort: string;
      male: number;
      female: number;
      total: number;
    }>;
  };
}

function getProgramSortOrder(programType: string): number {
  switch (programType) {
    case "SCIENCE_TECHNOLOGY_AND_ENGINEERING":
      return 1;
    case "SPECIAL_PROGRAM_IN_THE_ARTS":
      return 2;
    case "SPECIAL_PROGRAM_IN_SPORTS":
      return 3;
    case "REGULAR":
      return 4;
    default:
      return 5;
  }
}

function getProgramLabel(programType: string): string {
  switch (programType) {
    case "SCIENCE_TECHNOLOGY_AND_ENGINEERING":
      return "Science, Technology, and Engineering (STE)";
    case "SPECIAL_PROGRAM_IN_THE_ARTS":
      return "Special Program in the Arts (SPA)";
    case "SPECIAL_PROGRAM_IN_SPORTS":
      return "Special Program in Sports (SPS)";
    case "REGULAR":
      return "Basic Education Curriculum (BEC)";
    default:
      return programType;
  }
}

function getProgramShort(programType: string): string {
  switch (programType) {
    case "SCIENCE_TECHNOLOGY_AND_ENGINEERING":
      return "STE";
    case "SPECIAL_PROGRAM_IN_THE_ARTS":
      return "SPA";
    case "SPECIAL_PROGRAM_IN_SPORTS":
      return "SPS";
    case "REGULAR":
      return "BEC";
    default:
      return programType;
  }
}

/**
 * Fetch and organize grade level learners following standard DepEd sectioning rules.
 */
export async function getGradeLevelMasterlistData(
  gradeLevelId: number,
  schoolYearId: number,
): Promise<GradeLevelMasterlistData | null> {
  const [gradeLevel, schoolYear, schoolSetting, rawSections] = await Promise.all([
    prisma.gradeLevel.findUnique({ where: { id: gradeLevelId } }),
    prisma.schoolYear.findUnique({ where: { id: schoolYearId } }),
    prisma.schoolSetting.findFirst(),
    prisma.section.findMany({
      where: {
        gradeLevelId,
        schoolYearId,
      },
      include: {
        advisers: {
          where: { status: SectionAdviserStatus.ACTIVE },
          include: { teacher: true },
        },
        enrollmentRecords: {
          where: { ...activeEnrollmentFilter, isDraft: false },
          include: {
            enrollmentApplication: {
              include: {
                learner: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!gradeLevel || !schoolYear) {
    return null;
  }

  // 1. Group & Sort Sections: Program Type order, then Section Name alphabetically
  const sortedSections = [...rawSections].sort((a, b) => {
    const progDiff = getProgramSortOrder(a.programType) - getProgramSortOrder(b.programType);
    if (progDiff !== 0) return progDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const sectionGroups: SectionMasterlistGroup[] = [];
  const allLearners: MasterlistLearner[] = [];
  let globalCounter = 1;

  for (const sec of sortedSections) {
    const adviser = sec.advisers[0]?.teacher;
    const adviserName = adviser
      ? `${adviser.lastName.toUpperCase()}, ${adviser.firstName.toUpperCase()}${
          adviser.middleName ? " " + adviser.middleName.charAt(0).toUpperCase() + "." : ""
        }`
      : "TO BE ASSIGNED";

    const progType = sec.programType;
    const progLabel = getProgramLabel(progType);
    const progShort = getProgramShort(progType);

    // Filter valid enrolled learners
    const validLearners = sec.enrollmentRecords
      .map((r) => r.enrollmentApplication.learner)
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    // 2. Sort by Sex: Male learners first, then Female learners
    // 3. Sort by Name: Alphabetical order by Last Name, First Name, Middle Name
    const maleLearners = validLearners
      .filter((l) => l.sex === "MALE")
      .sort((a, b) => {
        const lastCmp = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
        if (lastCmp !== 0) return lastCmp;
        const firstCmp = a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
        if (firstCmp !== 0) return firstCmp;
        return (a.middleName || "").localeCompare(b.middleName || "", undefined, { sensitivity: "base" });
      });

    const femaleLearners = validLearners
      .filter((l) => l.sex !== "MALE")
      .sort((a, b) => {
        const lastCmp = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
        if (lastCmp !== 0) return lastCmp;
        const firstCmp = a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
        if (firstCmp !== 0) return firstCmp;
        return (a.middleName || "").localeCompare(b.middleName || "", undefined, { sensitivity: "base" });
      });

    const orderedLearners = [...maleLearners, ...femaleLearners];

    const mappedLearners: MasterlistLearner[] = orderedLearners.map((l) => {
      const middleInitial = l.middleName ? `${l.middleName.trim().charAt(0).toUpperCase()}.` : "";
      const learnerItem: MasterlistLearner = {
        no: globalCounter++,
        lrn: l.lrn ?? "",
        lastName: l.lastName.toUpperCase(),
        firstName: l.firstName.toUpperCase(),
        middleInitial,
        middleName: l.middleName ? l.middleName.toUpperCase() : "",
        sex: l.sex === "MALE" ? "MALE" : "FEMALE",
        sectionName: sec.name.toUpperCase(),
        programType: progType,
        programLabel: progLabel,
        programShort: progShort,
        adviserName,
      };
      allLearners.push(learnerItem);
      return learnerItem;
    });

    sectionGroups.push({
      sectionId: sec.id,
      sectionName: sec.name.toUpperCase(),
      programType: progType,
      programLabel: progLabel,
      programShort: progShort,
      adviserName,
      maleCount: maleLearners.length,
      femaleCount: femaleLearners.length,
      totalCount: mappedLearners.length,
      learners: mappedLearners,
    });
  }

  // Summary aggregation
  const programSummaryMap = new Map<
    string,
    { programType: string; programLabel: string; programShort: string; male: number; female: number; total: number }
  >();

  for (const sec of sectionGroups) {
    const existing = programSummaryMap.get(sec.programType) || {
      programType: sec.programType,
      programLabel: sec.programLabel,
      programShort: sec.programShort,
      male: 0,
      female: 0,
      total: 0,
    };
    existing.male += sec.maleCount;
    existing.female += sec.femaleCount;
    existing.total += sec.totalCount;
    programSummaryMap.set(sec.programType, existing);
  }

  const sortedSummary = Array.from(programSummaryMap.values()).sort(
    (a, b) => getProgramSortOrder(a.programType) - getProgramSortOrder(b.programType),
  );

  const totalMale = sortedSummary.reduce((acc, curr) => acc + curr.male, 0);
  const totalFemale = sortedSummary.reduce((acc, curr) => acc + curr.female, 0);
  const total = totalMale + totalFemale;

  return {
    schoolName: schoolSetting?.schoolName || "Enriqueta Montilla de Esteban Memorial High School",
    depedSchoolId: schoolSetting?.depedSchoolId || "302624",
    division: schoolSetting?.division || "Division of Negros Occidental",
    gradeLevelName: gradeLevel.name,
    gradeLevelId: gradeLevel.id,
    yearLabel: schoolYear.yearLabel,
    sections: sectionGroups,
    allLearners,
    summary: {
      total,
      totalMale,
      totalFemale,
      byProgram: sortedSummary,
    },
  };
}

/**
 * Generate Excel (.xlsx) workbook for Grade Level Masterlist.
 */
export async function generateGradeLevelMasterlistXlsx(
  data: GradeLevelMasterlistData,
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EnrollPro";
  workbook.lastModifiedBy = "EnrollPro System";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = `${data.gradeLevelName} Masterlist`.slice(0, 31);
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Explicit Column Definitions
  ws.columns = [
    { header: "No.", key: "no", width: 8 },
    { header: "LRN", key: "lrn", width: 18 },
    { header: "Last Name", key: "lastName", width: 22 },
    { header: "First Name", key: "firstName", width: 24 },
    { header: "Middle Initial", key: "middleInitial", width: 14 },
    { header: "Sex", key: "sex", width: 10 },
    { header: "Section", key: "section", width: 20 },
    { header: "Program", key: "program", width: 14 },
    { header: "Adviser", key: "adviser", width: 28 },
  ];

  // Header row style (Row 1)
  const headerRow = ws.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF881337" }, // Burgundy / primary school brand color
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Populate data rows
  data.allLearners.forEach((learner) => {
    const row = ws.addRow({
      no: learner.no,
      // Critical Protection: LRN must explicitly be formatted as text (prefixed with single quote)
      lrn: learner.lrn ? `'${learner.lrn}` : "",
      lastName: learner.lastName,
      firstName: learner.firstName,
      middleInitial: learner.middleInitial,
      sex: learner.sex,
      section: learner.sectionName,
      program: learner.programShort,
      adviser: learner.adviserName,
    });

    row.height = 20;

    // Row styles & formatting
    row.getCell("no").alignment = { vertical: "middle", horizontal: "center" };
    const lrnCell = row.getCell("lrn");
    lrnCell.numFmt = "@";
    lrnCell.alignment = { vertical: "middle", horizontal: "center" };

    row.getCell("lastName").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("firstName").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("middleInitial").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("sex").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("section").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("program").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("adviser").alignment = { vertical: "middle", horizontal: "left" };

    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  return workbook;
}

/**
 * Generate PDF document buffer for Grade Level Masterlist using PDFKit.
 */
export async function generateGradeLevelMasterlistPdf(
  data: GradeLevelMasterlistData,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        layout: "landscape",
        margin: 36, // 0.5 inch margins
        info: {
          Title: `${data.gradeLevelName} Section Assignment Masterlist`,
          Author: "EnrollPro",
          Subject: `Grade Level Masterlist S.Y. ${data.yearLabel}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 792;
      const pageHeight = 612;
      const margin = 36;
      const printableWidth = pageWidth - margin * 2; // 720pt

      const drawHeader = (pageNumber: number) => {
        doc.save();
        // School Header
        doc.fontSize(13).font("Helvetica-Bold").fillColor("#881337").text(data.schoolName.toUpperCase(), margin, margin, {
          align: "center",
          width: printableWidth,
        });

        doc.fontSize(11).font("Helvetica-Bold").fillColor("#0F172A").text(`${data.gradeLevelName.toUpperCase()} SECTION ASSIGNMENT MASTERLIST`, margin, margin + 17, {
          align: "center",
          width: printableWidth,
        });

        doc.fontSize(9).font("Helvetica").fillColor("#475569").text(`School Year ${data.yearLabel} • DepEd School ID: ${data.depedSchoolId}`, margin, margin + 32, {
          align: "center",
          width: printableWidth,
        });

        doc.fontSize(8).font("Helvetica-Oblique").fillColor("#64748B").text(`Page ${pageNumber}`, margin, margin + 32, {
          align: "right",
          width: printableWidth,
        });

        doc.restore();
      };

      // Table layout definitions
      const colWidths = {
        no: 34,
        lrn: 86,
        lastName: 96,
        firstName: 104,
        mi: 32,
        sex: 42,
        section: 90,
        program: 56,
        adviser: 180,
      };

      const tableX = margin;
      let currentY = margin + 50;
      let pageNumber = 1;

      drawHeader(pageNumber);

      const drawTableColumnHeaders = (y: number) => {
        doc.save();
        doc.rect(tableX, y, printableWidth, 18).fill("#F1F5F9");
        doc.rect(tableX, y, printableWidth, 18).stroke("#CBD5E1");

        let curX = tableX;
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#0F172A");

        doc.text("NO.", curX, y + 5, { width: colWidths.no, align: "center" });
        curX += colWidths.no;

        doc.text("LRN", curX, y + 5, { width: colWidths.lrn, align: "center" });
        curX += colWidths.lrn;

        doc.text("LAST NAME", curX + 4, y + 5, { width: colWidths.lastName - 8, align: "left" });
        curX += colWidths.lastName;

        doc.text("FIRST NAME", curX + 4, y + 5, { width: colWidths.firstName - 8, align: "left" });
        curX += colWidths.firstName;

        doc.text("M.I.", curX, y + 5, { width: colWidths.mi, align: "center" });
        curX += colWidths.mi;

        doc.text("SEX", curX, y + 5, { width: colWidths.sex, align: "center" });
        curX += colWidths.sex;

        doc.text("SECTION", curX + 4, y + 5, { width: colWidths.section - 8, align: "left" });
        curX += colWidths.section;

        doc.text("PROGRAM", curX, y + 5, { width: colWidths.program, align: "center" });
        curX += colWidths.program;

        doc.text("CLASS ADVISER", curX + 4, y + 5, { width: colWidths.adviser - 8, align: "left" });

        doc.restore();
        return y + 18;
      };

      currentY = drawTableColumnHeaders(currentY);

      // Iterate through sections and learners
      for (const sec of data.sections) {
        // Section break row
        const breakRowHeight = 18;
        if (currentY + breakRowHeight + 25 > pageHeight - margin - 50) {
          doc.addPage();
          pageNumber++;
          drawHeader(pageNumber);
          currentY = drawTableColumnHeaders(margin + 50);
        }

        // Render Section Sub-Header Bar
        doc.save();
        doc.rect(tableX, currentY, printableWidth, breakRowHeight).fill("#1E293B"); // Slate dark
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#FFFFFF");
        const breakText = `SECTION: ${sec.sectionName}   |   ADVISER: ${sec.adviserName}   |   PROGRAM: ${sec.programLabel.toUpperCase()}   (M: ${sec.maleCount}, F: ${sec.femaleCount}, TOTAL: ${sec.totalCount})`;
        doc.text(breakText, tableX + 8, currentY + 5, { width: printableWidth - 16, align: "left" });
        doc.restore();
        currentY += breakRowHeight;

        // Render learners in section
        let rowIndex = 0;
        for (const l of sec.learners) {
          const rowHeight = 16;
          if (currentY + rowHeight > pageHeight - margin - 50) {
            doc.addPage();
            pageNumber++;
            drawHeader(pageNumber);
            currentY = drawTableColumnHeaders(margin + 50);
          }

          doc.save();
          // Banded background
          const bg = rowIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
          doc.rect(tableX, currentY, printableWidth, rowHeight).fill(bg);
          doc.rect(tableX, currentY, printableWidth, rowHeight).strokeColor("#E2E8F0").lineWidth(0.5).stroke();

          let curX = tableX;
          doc.fontSize(8).font("Helvetica").fillColor("#1E293B");

          // No.
          doc.text(String(l.no), curX, currentY + 4, { width: colWidths.no, align: "center" });
          curX += colWidths.no;

          // LRN
          doc.font("Helvetica-Bold").text(l.lrn || "—", curX, currentY + 4, { width: colWidths.lrn, align: "center" });
          curX += colWidths.lrn;

          // Last Name
          doc.font("Helvetica").text(l.lastName, curX + 4, currentY + 4, { width: colWidths.lastName - 8, align: "left", ellipsis: true });
          curX += colWidths.lastName;

          // First Name
          doc.text(l.firstName, curX + 4, currentY + 4, { width: colWidths.firstName - 8, align: "left", ellipsis: true });
          curX += colWidths.firstName;

          // M.I.
          doc.text(l.middleInitial || "—", curX, currentY + 4, { width: colWidths.mi, align: "center" });
          curX += colWidths.mi;

          // Sex
          doc.font(l.sex === "MALE" ? "Helvetica-Bold" : "Helvetica").fillColor(l.sex === "MALE" ? "#1D4ED8" : "#BE185D");
          doc.text(l.sex === "MALE" ? "M" : "F", curX, currentY + 4, { width: colWidths.sex, align: "center" });
          curX += colWidths.sex;
          doc.fillColor("#1E293B").font("Helvetica");

          // Section
          doc.text(l.sectionName, curX + 4, currentY + 4, { width: colWidths.section - 8, align: "left", ellipsis: true });
          curX += colWidths.section;

          // Program
          doc.text(l.programShort, curX, currentY + 4, { width: colWidths.program, align: "center" });
          curX += colWidths.program;

          // Adviser
          doc.text(l.adviserName, curX + 4, currentY + 4, { width: colWidths.adviser - 8, align: "left", ellipsis: true });

          doc.restore();
          currentY += rowHeight;
          rowIndex++;
        }
      }

      // Summary Footer block at the bottom
      const summaryBoxHeight = 55;
      if (currentY + summaryBoxHeight > pageHeight - margin - 20) {
        doc.addPage();
        pageNumber++;
        drawHeader(pageNumber);
        currentY = margin + 50;
      } else {
        currentY += 10;
      }

      doc.save();
      doc.rect(tableX, currentY, printableWidth, summaryBoxHeight).fill("#F8FAFC");
      doc.rect(tableX, currentY, printableWidth, summaryBoxHeight).strokeColor("#CBD5E1").lineWidth(1).stroke();

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0F172A").text("GRADE LEVEL ENROLLMENT SUMMARY BY PROGRAM TYPE & SEX", tableX + 10, currentY + 7);

      let summaryY = currentY + 22;
      doc.fontSize(8).font("Helvetica").fillColor("#334155");

      const progSummaryText = data.summary.byProgram
        .map((p) => `${p.programShort}: ${p.total} (M: ${p.male}, F: ${p.female})`)
        .join("     |     ");

      doc.text(progSummaryText, tableX + 10, summaryY, { width: printableWidth - 20 });

      summaryY += 14;
      doc.font("Helvetica-Bold").fillColor("#881337").text(
        `OVERALL TOTAL: ${data.summary.total} LEARNERS   (TOTAL MALE: ${data.summary.totalMale}   •   TOTAL FEMALE: ${data.summary.totalFemale})`,
        tableX + 10,
        summaryY,
        { width: printableWidth - 20 },
      );

      doc.restore();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
