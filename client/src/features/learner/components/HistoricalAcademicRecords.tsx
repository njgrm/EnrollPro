import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { GradeCard } from "@/features/learner/components/GradeCard";
import type { AcademicHistory, SubjectGrades } from "@/features/learner/types";
import { DEPED_JHS_CORE_SUBJECTS } from "@/shared/components/AcademicHistoryAccordion";

export interface HistoricalAcademicRecordsProps {
  academicHistory: AcademicHistory[];
  activeSchoolYear: string;
}

interface ProcessedSubjectRecord {
  subject: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string | null;
  finalRating: string;
  remarks: string;
}

function formatVal(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "" || Number.isNaN(Number(val))) {
    return "—";
  }
  return String(val);
}

function getAcademicHonors(average: number | null | undefined): string {
  if (average === null || average === undefined || Number.isNaN(Number(average))) {
    return "—";
  }
  const num = Number(average);
  if (num >= 98 && num <= 100) return "WITH HIGHEST HONORS";
  if (num >= 95 && num <= 97) return "WITH HIGH HONORS";
  if (num >= 90 && num <= 94) return "WITH HONORS";
  if (num >= 75) return "PASSED";
  return "FAILED";
}

const SELECTED_SY_STORAGE_KEY = "learner_sf9_selected_sy";

export function HistoricalAcademicRecords({
  academicHistory,
  activeSchoolYear,
}: HistoricalAcademicRecordsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Find index from URL query param (?sy=...) or localStorage, fallback to activeSchoolYear or 0
  const resolvedIndex = useMemo(() => {
    if (!academicHistory || academicHistory.length === 0) return 0;

    const syParam = searchParams.get("sy");
    let savedSy: string | null = null;
    try {
      savedSy = localStorage.getItem(SELECTED_SY_STORAGE_KEY);
    } catch {
      // ignore localStorage errors (e.g. storage disabled / private mode)
    }

    const targetSy = syParam || savedSy;

    if (targetSy) {
      const matchIdx = academicHistory.findIndex(
        (h) =>
          h.school_year === targetSy ||
          `${h.grade_level}-${h.school_year}` === targetSy ||
          h.school_year.toLowerCase() === targetSy.toLowerCase() ||
          h.school_year.includes(targetSy) ||
          targetSy.includes(h.school_year),
      );
      if (matchIdx >= 0) return matchIdx;
    }

    // Default to active school year or first record
    const activeIdx = academicHistory.findIndex(
      (h) =>
        h.status?.toUpperCase() === "ACTIVE" ||
        h.school_year === activeSchoolYear ||
        h.school_year.includes(activeSchoolYear) ||
        activeSchoolYear.includes(h.school_year),
    );
    return activeIdx >= 0 ? activeIdx : 0;
  }, [academicHistory, activeSchoolYear, searchParams]);

  const [overrideIndex, setOverrideIndex] = useState<number | null>(null);

  // Derive selected index: user override if present, otherwise resolvedIndex from URL/storage
  const selectedIndex =
    overrideIndex !== null && academicHistory?.[overrideIndex]
      ? overrideIndex
      : resolvedIndex;

  // Sync URL search param on mount if not present
  useEffect(() => {
    const chosenRecord = academicHistory?.[resolvedIndex];
    if (chosenRecord && !searchParams.get("sy")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("sy", chosenRecord.school_year);
          return next;
        },
        { replace: true },
      );
    }
  }, [academicHistory, resolvedIndex, searchParams, setSearchParams]);

  const handleSelectYear = useCallback(
    (newIndex: number) => {
      setOverrideIndex(newIndex);
      const chosenRecord = academicHistory?.[newIndex];
      if (chosenRecord) {
        try {
          localStorage.setItem(SELECTED_SY_STORAGE_KEY, chosenRecord.school_year);
        } catch {
          // ignore localStorage error
        }

        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("sy", chosenRecord.school_year);
            return next;
          },
          { replace: true },
        );
      }
    },
    [academicHistory, setSearchParams],
  );

  // Safety check if history is empty
  if (!academicHistory || academicHistory.length === 0) {
    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-8 text-center space-y-2">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-bold text-foreground">No Academic Records Available</h3>
          <p className="text-sm text-muted-foreground">
            There are currently no historical academic grades or records on file for this learner.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedRecord = academicHistory[selectedIndex] || academicHistory[0];
  const isTrimester =
    selectedRecord.term_format === "TRIMESTER" || selectedRecord.term_format !== "QUARTERS";

  // Process subject records (merging Science / TLE rotation if needed, matching DepEd curriculum standards)
  const processedSubjects: ProcessedSubjectRecord[] = (() => {
    const hasGrades = selectedRecord.grades && Object.keys(selectedRecord.grades).length > 0;
    if (!hasGrades) {
      return DEPED_JHS_CORE_SUBJECTS.map((subj) => ({
        subject: subj,
        q1: "—",
        q2: "—",
        q3: "—",
        q4: isTrimester ? null : "—",
        finalRating: "—",
        remarks: "—",
      }));
    }

    const getCombinedLearningArea = (subjectName: string): "Science" | "TLE" | null => {
      const normalized = subjectName.trim().toLowerCase();
      if (
        normalized === "science" ||
        /^science \d+$/.test(normalized) ||
        normalized.startsWith("science - ")
      ) {
        return "Science";
      }
      if (
        normalized === "tle" ||
        /^tle \d+$/.test(normalized) ||
        normalized === "technology and livelihood education" ||
        normalized.startsWith("tle - ") ||
        normalized.startsWith("tle exploratory - ")
      ) {
        return "TLE";
      }
      return null;
    };

    const isDirectLearningArea = (subjectName: string, area: "Science" | "TLE"): boolean => {
      const normalized = subjectName.trim().toLowerCase();
      return area === "Science"
        ? normalized === "science" || /^science \d+$/.test(normalized)
        : normalized === "tle" ||
            /^tle \d+$/.test(normalized) ||
            normalized === "technology and livelihood education";
    };

    const averageGrades = (grades: SubjectGrades[]): SubjectGrades => {
      const average = (values: Array<number | null | undefined>): number | null => {
        const numericValues = values.filter((v): v is number => typeof v === "number");
        return numericValues.length > 0
          ? Math.round(numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length)
          : null;
      };

      let unifiedGrade = average(grades.map((g) => g.Final));
      if (unifiedGrade === null) {
        const allTermGrades = grades.flatMap((g) => [
          g.T1 ?? g.term1 ?? g.Q1,
          g.T2 ?? g.term2 ?? g.Q2,
          g.T3 ?? g.term3 ?? g.Q3,
        ]);
        unifiedGrade = average(allTermGrades);
      }

      return {
        T1: unifiedGrade,
        T2: unifiedGrade,
        T3: unifiedGrade,
        Q4: unifiedGrade,
        Final: unifiedGrade,
        remarks: unifiedGrade !== null ? (unifiedGrade >= 75 ? "Passed" : "Failed") : null,
      };
    };

    const subjectsToRender: string[] = [];
    const processedGrades: Record<string, SubjectGrades> = {};

    const combinedComponents: Record<"Science" | "TLE", SubjectGrades[]> = {
      Science: [],
      TLE: [],
    };
    const directLearningAreas: Partial<Record<"Science" | "TLE", SubjectGrades>> = {};

    for (const [subjectName, subjectGrades] of Object.entries(selectedRecord.grades!)) {
      const combinedArea = getCombinedLearningArea(subjectName);
      if (!combinedArea) {
        subjectsToRender.push(subjectName);
        processedGrades[subjectName] = subjectGrades;
        continue;
      }

      if (isDirectLearningArea(subjectName, combinedArea)) {
        directLearningAreas[combinedArea] = subjectGrades;
      } else {
        combinedComponents[combinedArea].push(subjectGrades);
      }
    }

    for (const combinedArea of ["Science", "TLE"] as const) {
      const directGrades = directLearningAreas[combinedArea];
      const componentGrades = combinedComponents[combinedArea];
      if (directGrades) {
        processedGrades[combinedArea] = directGrades;
        subjectsToRender.push(combinedArea);
      } else if (componentGrades.length > 0) {
        processedGrades[combinedArea] = averageGrades(componentGrades);
        subjectsToRender.push(combinedArea);
      }
    }

    return subjectsToRender.map((subj) => {
      const grades =
        processedGrades[subj] ||
        Object.entries(processedGrades).find(
          ([k]) => k.trim().toLowerCase() === subj.trim().toLowerCase(),
        )?.[1];

      const q1Val = isTrimester
        ? (grades?.T1 ?? grades?.term1 ?? grades?.Q1)
        : (grades?.Q1 ?? grades?.T1);
      const q2Val = isTrimester
        ? (grades?.T2 ?? grades?.term2 ?? grades?.Q2)
        : (grades?.Q2 ?? grades?.T2);
      const q3Val = isTrimester
        ? (grades?.T3 ?? grades?.term3 ?? grades?.Q3)
        : (grades?.Q3 ?? grades?.T3);
      const q4Val = !isTrimester ? grades?.Q4 : null;
      const finalVal = grades?.Final;
      const remarksVal =
        grades?.remarks ||
        (finalVal !== null && finalVal !== undefined
          ? Number(finalVal) >= 75
            ? "Passed"
            : "Failed"
          : "—");

      return {
        subject: subj,
        q1: formatVal(q1Val),
        q2: formatVal(q2Val),
        q3: formatVal(q3Val),
        q4: !isTrimester ? formatVal(q4Val) : null,
        finalRating: formatVal(finalVal),
        remarks: remarksVal,
      };
    });
  })();

  const honors = getAcademicHonors(selectedRecord.general_average);
  const isOverallPassed =
    selectedRecord.general_average !== null &&
    selectedRecord.general_average !== undefined &&
    selectedRecord.general_average >= 75;

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-2">
        <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-primary dark:text-foreground">
          Academic Records
        </h2>
      </div>

      {/* Prominent Dropdown Component: Select Academic Year */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-tight">
              Select School Year
            </h3>
          </div>
          <div className="w-full sm:w-80">
            <Select
              value={String(selectedIndex)}
              onValueChange={(val) => handleSelectYear(Number(val))}
            >
              <SelectTrigger className="w-full font-bold h-11" aria-label="Select School Year">
                <SelectValue placeholder="Select School Year" />
              </SelectTrigger>
              <SelectContent>
                {academicHistory.map((hist, idx) => {
                  const label = `${hist.grade_level}${
                    hist.section_name ? ` - ${hist.section_name}` : ""
                  } • S.Y. ${hist.school_year}`;
                  return (
                    <SelectItem key={idx} value={String(idx)} className="font-semibold py-2.5">
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected Year Header Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-extrabold text-foreground uppercase tracking-tight text-primary">
            {selectedRecord.grade_level}
            {selectedRecord.section_name ? ` - ${selectedRecord.section_name}` : ""}
          </h2>
          <p className="text-sm text-foreground font-bold">
            Official School Form 9 (SF9) • School Year {selectedRecord.school_year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold uppercase">
            {isTrimester ? "Trimester System" : "Quarterly Grading"}
          </Badge>
          <Badge
            variant={
              selectedRecord.status?.toUpperCase() === "ACTIVE"
                ? "default"
                : "secondary"
            }
            className="text-xs font-bold uppercase"
          >
            {selectedRecord.status || "Completed"}
          </Badge>
        </div>
      </div>

      {/* Mobile-Responsive Data Display: List of <GradeCard /> components (block on mobile, hidden on md) */}
      <div className="block md:hidden space-y-3">
        {processedSubjects.map((item) => (
          <GradeCard
            key={item.subject}
            subject={item.subject}
            q1={item.q1}
            q2={item.q2}
            q3={item.q3}
            q4={item.q4}
            isTrimester={isTrimester}
            finalRating={item.finalRating}
            remarks={item.remarks}
          />
        ))}

        {/* General Average Summary Card on Mobile */}
        <Card className="border border-border bg-card shadow-xs mt-4">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                General Average
              </span>
              <span className="text-xl font-extrabold text-foreground mt-0.5 block">
                {formatVal(selectedRecord.general_average)}
              </span>
            </div>
            {honors !== "—" && (
              <Badge
                variant={isOverallPassed ? "success" : "secondary"}
                className="text-xs font-bold uppercase px-3 py-1"
              >
                {honors}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Breakpoint: Traditional Table View (hidden on mobile, block on md/lg) */}
      <div className="hidden md:block">
        <Card className="border border-border bg-card shadow-xs overflow-hidden">
          <CardHeader className="p-4 bg-muted/40 border-b border-border">
            <CardTitle className="text-base font-bold uppercase text-foreground">
              Learning Areas & Performance Ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="border-b border-border">
                  <TableHead className="text-left font-bold uppercase text-foreground py-3.5 pl-6">
                    Learning Areas
                  </TableHead>
                  <TableHead className="text-center font-bold uppercase text-foreground py-3.5">
                    {isTrimester ? "Term 1" : "Quarter 1"}
                  </TableHead>
                  <TableHead className="text-center font-bold uppercase text-foreground py-3.5">
                    {isTrimester ? "Term 2" : "Quarter 2"}
                  </TableHead>
                  <TableHead className="text-center font-bold uppercase text-foreground py-3.5">
                    {isTrimester ? "Term 3" : "Quarter 3"}
                  </TableHead>
                  {!isTrimester && (
                    <TableHead className="text-center font-bold uppercase text-foreground py-3.5">
                      Quarter 4
                    </TableHead>
                  )}
                  <TableHead className="text-center font-bold uppercase text-foreground py-3.5">
                    Final Rating
                  </TableHead>
                  <TableHead className="text-center font-bold uppercase text-foreground py-3.5 pr-6">
                    Remarks
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedSubjects.map((item) => {
                  const isPassed = item.remarks.toLowerCase().includes("passed");
                  const isFailed = item.remarks.toLowerCase().includes("failed");

                  return (
                    <TableRow key={item.subject} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-bold uppercase text-foreground pl-6">
                        {item.subject}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">
                        {item.q1}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">
                        {item.q2}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">
                        {item.q3}
                      </TableCell>
                      {!isTrimester && (
                        <TableCell className="text-center font-semibold text-foreground">
                          {item.q4 ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-center font-bold text-foreground">
                        {item.finalRating}
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        {item.remarks !== "—" ? (
                          <Badge
                            variant={isPassed ? "success" : isFailed ? "danger" : "outline"}
                            className="uppercase font-bold"
                          >
                            {item.remarks}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-muted/50 border-t border-border">
                <TableRow className="font-bold">
                  <TableCell
                    colSpan={isTrimester ? 4 : 5}
                    className="text-right uppercase text-foreground font-bold pl-6 py-4"
                  >
                    General Average:
                  </TableCell>
                  <TableCell className="text-center text-lg font-extrabold text-foreground py-4">
                    {formatVal(selectedRecord.general_average)}
                  </TableCell>
                  <TableCell className="text-center py-4 pr-6">
                    {honors !== "—" ? (
                      <Badge
                        variant={isOverallPassed ? "success" : "secondary"}
                        className="font-bold uppercase px-3 py-1"
                      >
                        {honors}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
