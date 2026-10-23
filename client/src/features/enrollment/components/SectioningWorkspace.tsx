import { useCallback, useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import {
  Users,
  Search,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  AlertTriangle,
  MoreHorizontal,
  MoveRight,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import api from "@/shared/api/axiosInstance";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { sileo } from "sileo";
import { useHistoricalReadOnly } from "@/shared/hooks/useHistoricalReadOnly";
import { useSchoolYearContext } from "@/shared/hooks/useSchoolYearContext";
import {
  cn,
  SCP_LABELS,
  getGradeLevelBadgeStyles,
  formatGradeLevel,
  formatSectionProgramLabel,
  getGradeLevelSolidBgStyles,
  getGradeLevelActiveTabStyles,
} from "@/shared/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useSettingsStore } from "@/store/settings.slice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  getAllowedSectionProgramsForPlacement,
  getAutoDraftProgramType,
  type ApplicantType,
  type LearnerType,
} from "@enrollpro/shared";

import { ConfirmationModal } from "@/shared/ui/confirmation-modal";
import ViewMasterlist from "@/features/sections/pages/ViewMasterlist";
import { TwoPanelSkeleton } from "@/shared/components/PageLoadingSkeleton";
import { PageTransition } from "@/shared/components/PageTransition";
import { useResizablePanel } from "@/shared/hooks/useResizablePanel";
import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh";
import { useAuthStore } from "@/store/auth.slice";
import { AutoAssignVisualizer } from "./AutoAssignVisualizer";
import { FinalizingSectionLoader } from "./FinalizingSectionLoader";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LearnerReadyRow } from "./LearnerReadyRow";
import { WorkspaceSearchInput } from "./WorkspaceSearchInput";
import { SectionCardsPane } from "./SectionCardsPane";
import { runSectioningWithWorker } from "../services/runSectioningWithWorker";

interface SectionSummary {
  id: number;
  name: string;
  gradeLevel: string;
  gradeLevelOrder: number;
  gradeLevelId: number;
  sortOrder: number;
  maxCapacity: number;
  currentCount: number;
  boys: number;
  girls: number;
  adviser: string;
  programType: ApplicantType;
  isHomogeneous?: boolean;
  sectionRank?: number | null;
  draftCount?: number;
  draftBoys?: number;
  draftGirls?: number;
}

interface PoolLearner {
  applicationId: number;
  lrn: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  sex: "MALE" | "FEMALE";
  genAve: number | null;
  status: string;
  gradeLevel: string;
  gradeLevelId: number;
  duplicateFlag?: boolean;
  learnerType: LearnerType;
  isBalikAral: boolean;
  applicantType: ApplicantType;
  assignedProgram: ApplicantType | null;
  programType: ApplicantType;
  academicStatus: string;
  studentPhoto?: string | null;
  draftSectionId?: number;
  isFinalized?: boolean;
  finalizedSectionId?: number;
}

interface GradeLevelOption {
  id: number;
  name: string;
  displayOrder: number;
}

interface GradeLevelsResponse {
  gradeLevels: GradeLevelOption[];
}

interface ApiMessageResponse {
  message?: string;
}

function getApiMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiMessageResponse>(error)) {
    return error.response?.data.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

interface DraftGenderCounts {
  boys: number;
  girls: number;
}

interface DraftLearnerPlacement extends PoolLearner {
  sectionId: number;
  isOverridden: boolean;
  isNew?: boolean;
}

interface DraftSectionRoster {
  section: SectionSummary;
  learners: DraftLearnerPlacement[];
  genderCounts: DraftGenderCounts;
  totalCount: number;
  newCount?: number;
  isOverCapacity: boolean;
}

interface DraftPlacement {
  schoolYearId?: number;
  gradeLevelId: number;
  generatedAt: string;
  rosters: DraftSectionRoster[];
  unplacedLearners: PoolLearner[];
}

interface InlineMasterlistLearner {
  id: number;
  enrollmentApplicationId: number;
  lrn: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  sex: string;
  status: string;
  genAve: number | null;
}

interface InlineMasterlistResponse {
  learners: InlineMasterlistLearner[];
}

function InlineSectionTable({ sectionId, onMoveLearner, onRemoveLearner, onForfeitSlot }: { sectionId: number, onMoveLearner?: (learnerId: number, currentSectionId: number) => void, onRemoveLearner?: (learnerId: number, currentSectionId: number) => void, onForfeitSlot?: (learnerId: number, currentSectionId: number) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["section-masterlist", sectionId],
    queryFn: () => api.get<InlineMasterlistResponse>(`/sections/${sectionId}/masterlist`).then(r => r.data),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const learners = data?.learners ?? [];
  const isVirtualized = learners.length > 8;

  const rowVirtualizer = useVirtualizer({
    count: isVirtualized ? learners.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 58,
    overscan: 5,
  });

  if (isLoading) return <div className="p-4 text-center text-sm font-bold text-muted-foreground animate-pulse mt-4 border rounded-md">Loading learners...</div>;
  if (error || !data) return <div className="p-4 text-center text-sm font-bold text-destructive mt-4 border rounded-md">Failed to load learners</div>;
  if (learners.length === 0) return <div className="p-4 text-center text-sm font-bold text-foreground mt-4 border rounded-md">No learners assigned yet.</div>;

  const virtualItems = isVirtualized ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = isVirtualized ? rowVirtualizer.getTotalSize() : 0;
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "mt-4 overflow-x-auto rounded-md border bg-card cursor-default",
        isVirtualized && "max-h-[360px] overflow-y-auto relative",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className={cn("bg-muted text-foreground", isVirtualized && "sticky top-0 z-10 shadow-xs")}>
          <tr className="font-bold uppercase">
            <th className="p-3 font-bold">Learner</th>
            <th className="p-3 text-center font-bold">Sex</th>
            <th className="p-3 text-center font-bold">Status</th>
            <th className="p-3 text-center font-bold">Gen Ave</th>
            <th className="p-3 text-center font-bold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {isVirtualized ? (
            <>
              {paddingTop > 0 && (
                <tr>
                  <td colSpan={5} style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualItems.map((virtualRow) => {
                const l = learners[virtualRow.index];
                if (!l) return null;
                return (
                  <tr
                    key={l.id}
                    className={cn(
                      "hover:bg-muted/60 transition-colors",
                      virtualRow.index % 2 === 0 ? "bg-background" : "bg-muted/50",
                    )}
                  >
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-foreground uppercase">
                          {l.lastName}, {l.firstName} {l.middleName?.charAt(0) ? `${l.middleName.charAt(0)}.` : ""}
                        </span>
                        <span className="text-sm mt-0.5">
                          LRN: {l.lrn || "NO LRN"}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={cn(
                        "px-2",
                        l.sex === "MALE" ? "bg-blue-600/10 text-blue-600 border-blue-600 border-2" : "bg-pink-600/10 text-pink-600 border-pink-600 border-2"
                      )}>
                        {l.sex === "MALE" ? "M" : "F"}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={cn(
                        "px-2 uppercase",
                        l.status === "OFFICIALLY_ENROLLED" ? "bg-green-600 text-white hover:bg-green-600 border-green-600"
                          : l.status === "PENDING_CONFIRMATION" ? "bg-amber-500 text-white hover:bg-amber-500 border-amber-500"
                            : "bg-muted text-foreground border-muted hover:bg-muted"
                      )}>
                        {l.status === "OFFICIALLY_ENROLLED" ? "Enrolled" : l.status === "PENDING_CONFIRMATION" ? "Pending Confirmation" : "Pre-Registered"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">
                      {l.genAve?.toFixed(2) ?? "--"}
                    </td>
                    <td className="p-3 text-center">
                      {(onMoveLearner || onRemoveLearner || onForfeitSlot) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[100]">
                            {onMoveLearner && (
                              <DropdownMenuItem onClick={() => onMoveLearner(l.enrollmentApplicationId, sectionId)}>
                                <MoveRight className="mr-2 h-4 w-4" />
                                Move to Section
                              </DropdownMenuItem>
                            )}
                            {onRemoveLearner && (
                              <DropdownMenuItem onClick={() => onRemoveLearner(l.enrollmentApplicationId, sectionId)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Unassign Learner
                              </DropdownMenuItem>
                            )}
                            {onForfeitSlot && (
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onForfeitSlot(l.enrollmentApplicationId, sectionId)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove / Forfeit Slot
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td colSpan={5} style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </>
          ) : (
            learners.map((l, index) => (
              <tr key={l.id} className={cn("hover:bg-muted/60 transition-colors", index % 2 === 0 ? "bg-background" : "bg-muted/50")}>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-foreground uppercase">
                      {l.lastName}, {l.firstName} {l.middleName?.charAt(0) ? `${l.middleName.charAt(0)}.` : ""}
                    </span>
                    <span className="text-sm mt-0.5">
                      LRN: {l.lrn || "NO LRN"}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <Badge className={cn(
                    "px-2",
                    l.sex === "MALE" ? "bg-blue-600/10 text-blue-600 border-blue-600 border-2" : "bg-pink-600/10 text-pink-600 border-pink-600 border-2"
                  )}>
                    {l.sex === "MALE" ? "M" : "F"}
                  </Badge>
                </td>
                <td className="p-2 text-center">
                  <Badge className={cn(
                    "px-2 uppercase",
                    l.status === "OFFICIALLY_ENROLLED" ? "bg-green-600 text-white hover:bg-green-600 border-green-600"
                      : l.status === "PENDING_CONFIRMATION" ? "bg-amber-500 text-white hover:bg-amber-500 border-amber-500"
                        : "bg-muted text-foreground border-muted hover:bg-muted"
                  )}>
                    {l.status === "OFFICIALLY_ENROLLED" ? "Enrolled" : l.status === "PENDING_CONFIRMATION" ? "Pending Confirmation" : "Pre-Registered"}
                  </Badge>
                </td>
                <td className="p-3 text-center font-bold text-foreground">
                  {l.genAve?.toFixed(2) ?? "--"}
                </td>
                <td className="p-3 text-center">
                  {(onMoveLearner || onRemoveLearner || onForfeitSlot) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-[100]">
                        {onMoveLearner && (
                          <DropdownMenuItem onClick={() => onMoveLearner(l.enrollmentApplicationId, sectionId)}>
                            <MoveRight className="mr-2 h-4 w-4" />
                            Move to Section
                          </DropdownMenuItem>
                        )}
                        {onRemoveLearner && (
                          <DropdownMenuItem onClick={() => onRemoveLearner(l.enrollmentApplicationId, sectionId)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Unassign Learner
                          </DropdownMenuItem>
                        )}
                        {onForfeitSlot && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onForfeitSlot(l.enrollmentApplicationId, sectionId)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove / Forfeit Slot
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


interface DraftMoveAction {
  type: "MOVE" | "SWAP";
  learnerApplicationId: number;
  fromSectionId: number;
}

interface CommitDraftAssignment {
  sectionId: number;
  applicationIds: number[];
}

interface SkippedApplication {
  applicationId: number;
  reason: string;
}

interface CommitDraftResponse {
  committedCount: number;
  committedApplications: Array<{
    applicationId: number;
    enrollmentRecordId: number;
    sectionId: number;
    sectioningMethod: string;
  }>;
  skippedApplications: SkippedApplication[];
}

const SCP_SHORT_LABELS: Partial<Record<ApplicantType, string>> = {
  REGULAR: "BEC",
  LATE_ENROLLEE: "Late",
  SCIENCE_TECHNOLOGY_AND_ENGINEERING: "STE",
  SPECIAL_PROGRAM_IN_THE_ARTS: "SPA",
  SPECIAL_PROGRAM_IN_SPORTS: "SPS",
  SPECIAL_PROGRAM_IN_JOURNALISM: "SPJ",
  SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE: "SPFL",
  SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION: "SPTVE",
};

const formatLearnerName = (
  learner: Pick<PoolLearner, "lastName" | "firstName" | "middleName">,
) => {
  const middleInitial = learner.middleName?.charAt(0)
    ? ` ${learner.middleName.charAt(0)}.`
    : "";
  return `${learner.lastName}, ${learner.firstName}${middleInitial}`;
};

const sortLearnersByAverage = (first: PoolLearner, second: PoolLearner) => {
  const firstAverage = first.genAve ?? -1;
  const secondAverage = second.genAve ?? -1;
  return (
    secondAverage - firstAverage || first.applicationId - second.applicationId
  );
};

const _interleaveBySex = (learners: PoolLearner[]) => {
  const males = learners
    .filter((learner) => learner.sex === "MALE")
    .sort(sortLearnersByAverage);
  const females = learners
    .filter((learner) => learner.sex === "FEMALE")
    .sort(sortLearnersByAverage);
  const ordered: PoolLearner[] = [];
  let maleIndex = 0;
  let femaleIndex = 0;
  let preferMale = males.length >= females.length;

  while (maleIndex < males.length || femaleIndex < females.length) {
    const preferred = preferMale ? males[maleIndex] : females[femaleIndex];
    const fallback = preferMale ? females[femaleIndex] : males[maleIndex];
    const selected = preferred ?? fallback;
    if (!selected) break;

    ordered.push(selected);
    if (selected.sex === "MALE") maleIndex += 1;
    else femaleIndex += 1;
    preferMale = !preferMale;
  }

  return ordered;
};

const calculateGenderCounts = (
  learners: DraftLearnerPlacement[],
): DraftGenderCounts => {
  return {
    boys: learners.filter((learner) => learner.sex === "MALE").length,
    girls: learners.filter((learner) => learner.sex === "FEMALE").length,
  };
};

const buildRoster = (
  section: SectionSummary,
  learners: DraftLearnerPlacement[],
): DraftSectionRoster => {
  const sortedLearners = [...learners].sort(sortLearnersByAverage);
  const totalCount = sortedLearners.length;
  const newCount = sortedLearners.filter((learner) => Boolean(learner.isNew)).length;
  return {
    section,
    learners: sortedLearners,
    genderCounts: calculateGenderCounts(sortedLearners),
    totalCount,
    newCount,
    isOverCapacity: totalCount > section.maxCapacity,
  };
};

const rebuildDraftPlacement = (draft: DraftPlacement): DraftPlacement => ({
  ...draft,
  rosters: draft.rosters.map((roster) =>
    buildRoster(
      roster.section,
      roster.learners.map((learner) => ({
        ...learner,
        isNew:
          learner.isFinalized && !learner.isOverridden
            ? false
            : learner.isNew !== undefined
            ? learner.isNew
            : Boolean(learner.isOverridden || !learner.isFinalized),
      })),
    ),
  ),
});

const snakeDraftLearners = (
  sections: SectionSummary[],
  males: PoolLearner[],
  females: PoolLearner[],
  rostersBySectionId: Map<number, DraftLearnerPlacement[]>,
  remainingCapacity: Map<number, number>
): PoolLearner[] => {
  console.log("=== snakeDraftLearners called ===");
  console.log("Sections:", sections.map(s => ({ id: s.id, name: s.name, maxCapacity: s.maxCapacity, currentCount: s.currentCount })));
  console.log("remainingCapacity before:", Array.from(remainingCapacity.entries()));
  console.log("males count:", males.length, "females count:", females.length);
  const unplaced: PoolLearner[] = [];
  let sectionIndex = 0;
  let forward = true;

  const getNextValidSection = () => {
    const totalRemaining = Array.from(remainingCapacity.values()).reduce((sum, c) => sum + c, 0);
    if (totalRemaining <= 0) return null;

    const startState = { idx: sectionIndex, fwd: forward };
    let looped = false;

    while (true) {
      const current = sectionIndex;
      const section = sections[current];

      if (forward) {
        if (sectionIndex >= sections.length - 1) forward = false;
        else sectionIndex++;
      } else {
        if (sectionIndex <= 0) forward = true;
        else sectionIndex--;
      }

      if (remainingCapacity.get(section.id)! > 0) return section;

      if (sectionIndex === startState.idx && forward === startState.fwd) {
        if (looped) return null;
        looped = true;
      }
    }
  };

  for (const learner of males) {
    const targetSection = getNextValidSection();
    if (targetSection) {
      rostersBySectionId.get(targetSection.id)!.push({ ...learner, sectionId: targetSection.id, isOverridden: false });
      remainingCapacity.set(targetSection.id, remainingCapacity.get(targetSection.id)! - 1);
    } else {
      unplaced.push(learner);
    }
  }

  // Reset pointer for females to ensure perfectly symmetric academic parity
  sectionIndex = 0;
  forward = true;

  for (const learner of females) {
    const targetSection = getNextValidSection();
    if (targetSection) {
      rostersBySectionId.get(targetSection.id)!.push({ ...learner, sectionId: targetSection.id, isOverridden: false });
      remainingCapacity.set(targetSection.id, remainingCapacity.get(targetSection.id)! - 1);
    } else {
      unplaced.push(learner);
    }
  }

  console.log("remainingCapacity after:", Array.from(remainingCapacity.entries()));
  console.log("unplaced length:", unplaced.length);
  return unplaced;
}

const loadDraftPlacementFromServer = (
  gradeLevelId: number,
  learners: PoolLearner[],
  sections: SectionSummary[],
  schoolYearId?: number,
): DraftPlacement => {
  const rostersBySectionId = new Map<number, DraftLearnerPlacement[]>(
    sections.map((section) => [section.id, []])
  );
  const unplacedLearners: PoolLearner[] = [];

  for (const learner of learners) {
    if (String(learner.gradeLevelId) !== String(gradeLevelId)) continue;
    const targetSectionId = learner.draftSectionId ?? learner.finalizedSectionId;
    if (targetSectionId) {
      if (!rostersBySectionId.has(targetSectionId)) {
        rostersBySectionId.set(targetSectionId, []);
      }
      rostersBySectionId.get(targetSectionId)!.push({
        ...learner,
        sectionId: targetSectionId,
        isOverridden: false,
        isNew: !learner.isFinalized,
      });
    } else if (!learner.isFinalized) {
      unplacedLearners.push(learner);
    }
  }

  return {
    schoolYearId,
    gradeLevelId,
    generatedAt: new Date().toISOString(),
    rosters: sections.map((section) =>
      buildRoster(section, rostersBySectionId.get(section.id) ?? [])
    ),
    unplacedLearners,
  };
};

const _createDraftPlacement = (
  gradeLevelId: number,
  learners: PoolLearner[],
  sections: SectionSummary[],
  enableHomogeneousSections: boolean,
  homogeneousSectionCount: number,
  heterogeneousRoundRobin: boolean,
  topBecHeterogeneousRoundRobin: boolean,
  _previousRosters?: DraftSectionRoster[],
  schoolYearId?: number,
): DraftPlacement => {
  const rostersBySectionId = new Map<number, DraftLearnerPlacement[]>(
    sections.map((section) => [section.id, []])
  );
  const unplacedLearners: PoolLearner[] = [];

  const unassignedLearners: PoolLearner[] = [];

  for (const learner of learners) {
    if (String(learner.gradeLevelId) === String(gradeLevelId)) {
      unassignedLearners.push(learner);
    }
  }

  const programTypes = Array.from(
    new Set(unassignedLearners.map((learner) => getAutoDraftProgramType(learner)))
  );

  for (const programType of programTypes) {
    const rawProgramLearners = unassignedLearners.filter(
      (learner) => getAutoDraftProgramType(learner) === programType
    );
    const programSections = sections.filter(
      (section) => section.programType === programType
    );

    // Phase 1: Global Sorting & Preparation
    // Strict Descending Sort: Highest Gen Ave first. Tie-breaker: Last Name, First Name.
    const sortedLearners = [...rawProgramLearners].sort((a, b) => {
      const aAve = a.genAve ?? -1;
      const bAve = b.genAve ?? -1;
      if (aAve !== bAve) return bAve - aAve;

      const nameA = `${a.lastName}, ${a.firstName}`;
      const nameB = `${b.lastName}, ${b.firstName}`;
      return nameA.localeCompare(nameB);
    });

    const orderedSections = [...programSections].sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name) ||
        first.id - second.id
    );

    if (sortedLearners.length === 0 || orderedSections.length === 0) {
      unplacedLearners.push(...sortedLearners);
      continue;
    }

    let remainingLearners = [...sortedLearners];

    // Phase 2: Homogeneous Allocation (Pilot/Top Sections)
    let topSections: SectionSummary[] = [];
    let regularSections: SectionSummary[] = orderedSections;

    if (programType === "REGULAR" && enableHomogeneousSections) {
      topSections = orderedSections.filter(s => s.isHomogeneous).slice(0, homogeneousSectionCount);
      const topSectionIds = new Set(topSections.map(s => s.id));
      regularSections = orderedSections.filter(s => !topSectionIds.has(s.id));
    }

    if (topSections.length > 0) {
      // Calculate Balanced Total Top Capacity
      const totalSections = topSections.length + regularSections.length;
      const targetPerSection = Math.ceil(remainingLearners.length / totalSections);
      const maxAvailableTopCapacity = topSections.reduce((acc, sec) => acc + (sec.maxCapacity || 40), 0);
      const balancedTopCapacity = targetPerSection * topSections.length;
      const totalTopCapacity = Math.min(balancedTopCapacity, maxAvailableTopCapacity);

      // Filter out conditionally promoted learners
      const eligibleForTop = remainingLearners.filter(
        (l) => l.academicStatus !== "CONDITIONALLY_PROMOTED"
      );

      // The Slice: Extract top N learners
      const topLearners = eligibleForTop.slice(0, totalTopCapacity);

      const unplacedTop: PoolLearner[] = topBecHeterogeneousRoundRobin
        ? (() => {
            const topRemainingCapacity = new Map(
              topSections.map(s => [s.id, s.maxCapacity || 40])
            );
            const topMales = topLearners.filter(l => l.sex === "MALE");
            const topFemales = topLearners.filter(l => l.sex === "FEMALE");
            return snakeDraftLearners(topSections, topMales, topFemales, rostersBySectionId, topRemainingCapacity);
          })()
        : (() => {
            // STRICT HOMOGENEOUS / STRICT ACADEMIC RANKING FOR TOP BEC:
            // Fill each top section sequentially from highest to lowest rank up to its capacity limit.
            let unassignedTop = [...topLearners];
            const targetPerTopSection = Math.ceil(topLearners.length / topSections.length);
            for (const section of topSections) {
              const maxAvail = section.maxCapacity || 40;
              const capacity = Math.min(targetPerTopSection, maxAvail);
              const assigned = unassignedTop.slice(0, capacity);
              unassignedTop = unassignedTop.slice(capacity);

              const roster = rostersBySectionId.get(section.id);
              if (roster) {
                assigned.forEach(l => roster.push({ ...l, sectionId: section.id, draftSectionId: section.id, isOverridden: false }));
              }
            }
            return unassignedTop;
          })();

      // Remove assigned top learners from the master pool
      const unplacedTopIds = new Set(unplacedTop.map(l => l.applicationId));
      const assignedTopIds = new Set(topLearners.filter(l => !unplacedTopIds.has(l.applicationId)).map(l => l.applicationId));
      remainingLearners = remainingLearners.filter((l) => !assignedTopIds.has(l.applicationId));

    }

    // Phase 3: Allocation (Regular Sections)
    if (remainingLearners.length > 0 && regularSections.length > 0) {
      if (heterogeneousRoundRobin) {
        const remainingCapacity = new Map(
          regularSections.map(s => [s.id, s.maxCapacity || 40])
        );

        const males = remainingLearners.filter(l => l.sex === "MALE");
        const females = remainingLearners.filter(l => l.sex === "FEMALE");

        const unplaced = snakeDraftLearners(regularSections, males, females, rostersBySectionId, remainingCapacity);
        remainingLearners = unplaced;
      } else {
        // STRICT HOMOGENEOUS: Fill each section up to target capacity sequentially.
        const totalSections = regularSections.length;
        const targetPerSection = Math.ceil(remainingLearners.length / totalSections);
        for (const section of regularSections) {
          const maxAvail = section.maxCapacity || 40;
          const capacity = Math.min(targetPerSection, maxAvail);
          const assigned = remainingLearners.slice(0, capacity);
          remainingLearners = remainingLearners.slice(capacity);

          const roster = rostersBySectionId.get(section.id);
          if (roster) {
            assigned.forEach(l => roster.push({ ...l, sectionId: section.id, draftSectionId: section.id, isOverridden: false }));
          }
        }
      }
    }

    // Any leftovers become unplaced
    if (remainingLearners.length > 0) {
      unplacedLearners.push(...remainingLearners);
    }
  }

  for (const section of sections) {
    const sectionLearners = rostersBySectionId.get(section.id) ?? [];
    for (const learner of sectionLearners) {
      learner.isNew = !learner.isFinalized;
    }
  }

  return {
    schoolYearId,
    gradeLevelId,
    generatedAt: new Date().toISOString(),
    rosters: sections.map((section) =>
      buildRoster(section, rostersBySectionId.get(section.id) ?? [])
    ),
    unplacedLearners,
  };
};

export function SectioningWorkspace() {
  const [, startTransition] = useTransition();
  const { isHistoricalReadOnly } = useHistoricalReadOnly();
  const { panelPercentage, startResizingRight } = useResizablePanel(45, {
    storageKey: "sectioning-workspace-pane",
  });

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const [mobileSectioningView, setMobileSectioningView] = useState<"queue" | "sections">("queue");

  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [pool, setPool] = useState<PoolLearner[]>([]);
  const [reRunWarningOpen, setReRunWarningOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [autoAssignPhase, setAutoAssignPhase] = useState<"idle" | "loading" | "resolving">("idle");
  const autoAssignTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const [isRightPaneFullscreen, setIsRightPaneFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<number>>(
    new Set(),
  );
  const [draftMoveAction, setDraftMoveAction] =
    useState<DraftMoveAction | null>(null);
  const [normalMoveAction, setNormalMoveAction] = useState<{
    learnerApplicationId: number;
    fromSectionId: number;
  } | null>(null);
  const [normalRemoveAction, setNormalRemoveAction] = useState<{
    learnerApplicationId: number;
    fromSectionId: number;
  } | null>(null);
  const [forfeitAction, setForfeitAction] = useState<{
    learnerApplicationId: number;
    fromSectionId: number;
  } | null>(null);
  const [moveDestinationSectionId, setMoveDestinationSectionId] = useState("");
  const [swapApplicationId, setSwapApplicationId] = useState("");
  const [autoAssignConfirmOpen, setAutoAssignConfirmOpen] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(true);
  const [animationScene, setAnimationScene] = useState(0);
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [allowCapacityOverride, setAllowCapacityOverride] = useState(false);
  const [commitProcessing, setCommitProcessing] = useState(false);
  const isCommittingRef = useRef(false);
  const justCommittedRef = useRef(false);
  const [finalizingProgress, setFinalizingProgress] = useState<{
    currentSection: string;
    completedSections: number;
    totalSections: number;
    isComplete?: boolean;
  } | null>(null);
  const [masterlistModalSectionId, setMasterlistModalSectionId] = useState<
    number | null
  >(null);

  const queryClient = useQueryClient();
  const enableHomogeneousSections = useSettingsStore((s) => s.enableHomogeneousSections);
  const heterogeneousRoundRobin = useSettingsStore((s) => s.heterogeneousRoundRobin);
  const topBecHeterogeneousRoundRobin = useSettingsStore((s) => s.topBecHeterogeneousRoundRobin ?? true);

  useEffect(() => () => {
    autoAssignTimers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!isAnimationVisible || !autoAssignConfirmOpen) {
      setAnimationScene(0);
      setIsAnimationPaused(false);
      return;
    }
    if (isAnimationPaused) return;

    const timer = setInterval(() => {
      setAnimationScene((prev) => {
        let next = (prev + 1) % 4;
        if (!enableHomogeneousSections && next === 2) {
          next = 3;
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isAnimationVisible, autoAssignConfirmOpen, enableHomogeneousSections, isAnimationPaused]);

  const handleNextScene = () => {
    setAnimationScene((prev) => {
      let next = (prev + 1) % 4;
      if (!enableHomogeneousSections && next === 2) next = 3;
      return next;
    });
  };

  const handlePrevScene = () => {
    setAnimationScene((prev) => {
      let next = (prev - 1 + 4) % 4;
      if (!enableHomogeneousSections && next === 2) next = 1;
      return next;
    });
  };

  const rawActiveGradeLevelId = useSettingsStore((s) => s.uiPreferences.sectioningGradeId);
  const setActiveGradeLevelId = useCallback((id: string) => {
    useSettingsStore.getState().updateUiPreference("sectioningGradeId", id);
  }, []);

  const homogeneousSectionCount = useSettingsStore((s) => s.homogeneousSectionCount);
  const { spaEnabled, spsEnabled, steEnabled } = useSettingsStore();
  const ancillaryRolesRaw = useAuthStore((s) => s.user?.ancillaryRoles);
  const ancillaryRoles = useMemo(() => ancillaryRolesRaw ?? [], [ancillaryRolesRaw]);

  const { data: activeSchoolYear } = useQuery({
    queryKey: ["school-years", "active", "grade-levels"],
    queryFn: async () => {
      const res = await api.get<GradeLevelsResponse>("/school-years/grade-levels");
      return res.data;
    },
    staleTime: 60_000,
  });

  const { data: gradeLevelsResponse, isLoading: gradeLevelsLoading } = useQuery(
    {
      queryKey: ["settings", "grade-levels"],
      queryFn: () =>
        api
          .get<GradeLevelsResponse>("/school-years/grade-levels")
          .then((response) => response.data),
      staleTime: 60_000,
    },
  );

  const userRoles = useAuthStore((s) => s.user?.roles) ?? [];
  const isAdminOrRegistrar = userRoles.includes("SYSTEM_ADMIN") || userRoles.includes("HEAD_REGISTRAR") || userRoles.includes("SCHOOL_REGISTRAR");

  const gradeLevels = useMemo(() => {
    const raw = gradeLevelsResponse?.gradeLevels ?? [];
    let jhs = raw.filter((gradeLevel) =>
      ["Grade 7", "Grade 8", "Grade 9", "Grade 10"].includes(gradeLevel.name),
    );

    if (!isAdminOrRegistrar) {
      const allowedNames: string[] = [];
      if (ancillaryRoles.includes("GRADE 7 COORDINATOR")) allowedNames.push("Grade 7");
      if (ancillaryRoles.includes("GRADE 8 COORDINATOR")) allowedNames.push("Grade 8");
      if (ancillaryRoles.includes("GRADE 9 COORDINATOR")) allowedNames.push("Grade 9");
      if (ancillaryRoles.includes("GRADE 10 COORDINATOR")) allowedNames.push("Grade 10");

      if (allowedNames.length > 0) {
        jhs = jhs.filter((g) => allowedNames.includes(g.name));
      }
    }

    return jhs.sort((a, b) => {
      const orderA = a.displayOrder ?? parseInt(a.name.replace(/\D/g, "")) ?? 0;
      const orderB = b.displayOrder ?? parseInt(b.name.replace(/\D/g, "")) ?? 0;
      return orderA - orderB;
    });
  }, [gradeLevelsResponse, isAdminOrRegistrar, ancillaryRoles]);

  const activeGradeLevelId = useMemo(() => {
    if (gradeLevels.length === 0) return rawActiveGradeLevelId;
    if (gradeLevels.some((g) => String(g.id) === rawActiveGradeLevelId)) {
      return rawActiveGradeLevelId;
    }
    return String(gradeLevels[0].id);
  }, [gradeLevels, rawActiveGradeLevelId]);

  useEffect(() => {
    if (activeGradeLevelId && activeGradeLevelId !== rawActiveGradeLevelId) {
      setActiveGradeLevelId(activeGradeLevelId);
    }
  }, [activeGradeLevelId, rawActiveGradeLevelId, setActiveGradeLevelId]);

  const { ayId, ayLabel } = useSchoolYearContext();
  const storageKey = `enrollpro_draft_placements_${ayId || "active"}`;

  const [draftPlacements, setDraftPlacements] = useState<Record<string, DraftPlacement>>(() => {
    try {
      const stored =
        localStorage.getItem(storageKey) ||
        localStorage.getItem("enrollpro_draft_placements");
      if (!stored) return {};
      const parsed = JSON.parse(stored) as Record<string, DraftPlacement>;
      const normalized: Record<string, DraftPlacement> = {};
      for (const [key, dp] of Object.entries(parsed)) {
        if (dp.schoolYearId && ayId && dp.schoolYearId !== ayId) continue;
        const totalDrafted =
          dp.rosters?.reduce(
            (sum, r) => sum + (r.learners?.length || 0),
            0,
          ) || 0;
        // Do not restore ghost/empty drafts where all rosters have 0 learners
        if (totalDrafted === 0) continue;

        normalized[key] = {
          ...dp,
          schoolYearId: dp.schoolYearId || (ayId ?? undefined),
          unplacedLearners: (dp.unplacedLearners || []).filter(
            (l) =>
              (String(l.gradeLevelId) === key ||
                String(l.gradeLevelId) === String(dp.gradeLevelId)) &&
              !l.isFinalized,
          ),
          rosters: dp.rosters.map((roster) =>
            buildRoster(
              roster.section,
              roster.learners
                .filter(
                  (l) =>
                    String(l.gradeLevelId) === key ||
                    String(l.gradeLevelId) === String(dp.gradeLevelId),
                )
                .map((l) => ({
                  ...l,
                  isNew:
                    l.isFinalized && !l.isOverridden
                      ? false
                      : l.isNew !== undefined
                      ? l.isNew
                      : Boolean(l.isOverridden || !l.isFinalized),
                })),
            ),
          ),
        };
      }
      return normalized;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draftPlacements));
    localStorage.removeItem("enrollpro_draft_placements");
  }, [draftPlacements, storageKey]);

  const draftPlacement = useMemo(() => {
    return draftPlacements[activeGradeLevelId] || null;
  }, [draftPlacements, activeGradeLevelId]);

  const setDraftPlacement = useCallback(
    (
      newDraft:
        | DraftPlacement
        | null
        | ((prev: DraftPlacement | null) => DraftPlacement | null),
    ) => {
      setDraftPlacements((prev) => {
        let draft =
          typeof newDraft === "function"
            ? newDraft(prev[activeGradeLevelId] || null)
            : newDraft;
        if (draft && ayId) {
          draft = { ...draft, schoolYearId: ayId };
        }
        if (draft === null) {
          if (!prev[activeGradeLevelId]) return prev;
          const copy = { ...prev };
          delete copy[activeGradeLevelId];
          return copy;
        }
        if (prev[activeGradeLevelId] === draft) {
          return prev;
        }
        return { ...prev, [activeGradeLevelId]: draft };
      });
    },
    [activeGradeLevelId, ayId],
  );

  useRealtimeRefresh({
    topics: ["sectioning:pool", "sectioning:sections", "students:list"],
    onRefresh: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sectioningPool() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sectioningSections() });
    },
  });

  const assignedGradeLevelId = useMemo(() => {
    if (!activeSchoolYear?.gradeLevels) return null;
    if (isAdminOrRegistrar) return null;
    if (ancillaryRoles.includes("GRADE 7 COORDINATOR")) return activeSchoolYear.gradeLevels.find((gradeLevel) => gradeLevel.name === "Grade 7")?.id ?? null;
    if (ancillaryRoles.includes("GRADE 8 COORDINATOR")) return activeSchoolYear.gradeLevels.find((gradeLevel) => gradeLevel.name === "Grade 8")?.id ?? null;
    if (ancillaryRoles.includes("GRADE 9 COORDINATOR")) return activeSchoolYear.gradeLevels.find((gradeLevel) => gradeLevel.name === "Grade 9")?.id ?? null;
    if (ancillaryRoles.includes("GRADE 10 COORDINATOR")) return activeSchoolYear.gradeLevels.find((gradeLevel) => gradeLevel.name === "Grade 10")?.id ?? null;
    return null;
  }, [isAdminOrRegistrar, ancillaryRoles, activeSchoolYear?.gradeLevels]);

  const {
    data: sectionsData,
    isLoading: sectionsInitialLoading,
    error: sectionsError,
    refetch: refetchSections,
  } = useQuery({
    queryKey: [...queryKeys.sectioningSections(), assignedGradeLevelId],
    queryFn: () =>
      api
        .get<SectionSummary[]>("/sectioning/sections-summary", {
          params: assignedGradeLevelId ? { gradeLevelId: assignedGradeLevelId } : {}
        })
        .then((r) => r.data),
    enabled: !isHistoricalReadOnly,
    refetchOnWindowFocus: true,
    staleTime: 3_000,
  });

  const {
    data: poolData,
    isLoading: poolInitialLoading,
    error: poolError,
    refetch: refetchPool,
  } = useQuery({
    queryKey: [...queryKeys.sectioningPool(), assignedGradeLevelId, Boolean(draftPlacement)],
    queryFn: () =>
      api.get<PoolLearner[]>("/sectioning/pool", {
        params: {
          ...(assignedGradeLevelId ? { gradeLevelId: assignedGradeLevelId } : {}),
          ...(draftPlacement ? { includeAssigned: "true" } : {})
        }
      }).then((r) => r.data),
    enabled: !isHistoricalReadOnly,
    refetchOnWindowFocus: true,
    staleTime: 3_000,
  });

  useEffect(() => {
    if (sectionsData) {
      if (!draftPlacement || sections.length === 0) {
        setSections((prev) => (prev === sectionsData ? prev : sectionsData));
      }
    }
  }, [sectionsData, draftPlacement, sections.length]);

  useEffect(() => {
    if (justCommittedRef.current) return;
    if (poolData) {
      if (!draftPlacement) {
        const unfinalized = poolData.filter((p) => !p.isFinalized);
        setPool((prev) => {
          if (
            prev.length === unfinalized.length &&
            prev.every((p, i) => p.applicationId === unfinalized[i]?.applicationId)
          ) {
            return prev;
          }
          return unfinalized;
        });
      } else {
        setPool((prev) => (prev === poolData ? prev : poolData));
      }
    }
  }, [poolData, draftPlacement]);

  useEffect(() => {
    if (!poolData || poolInitialLoading || isCommittingRef.current || justCommittedRef.current) return;

    setDraftPlacement((currentDraft) => {
      if (!currentDraft) return currentDraft;

      const poolMap = new Map(poolData.map((l) => [l.applicationId, l]));
      let hasChanges = false;
      const existingAppIds = new Set<number>();

      const nextRosters = currentDraft.rosters.map((roster) => {
        const freshLearners = roster.learners
          .filter((l) => {
            if (!poolMap.has(l.applicationId)) {
              hasChanges = true;
              return false;
            }
            if (String(l.gradeLevelId) !== String(currentDraft.gradeLevelId)) {
              hasChanges = true;
              return false;
            }
            return true;
          })
          .map((l) => {
            existingAppIds.add(l.applicationId);
            const fresh = poolMap.get(l.applicationId)!;
            if (
              fresh.status !== l.status ||
              fresh.draftSectionId !== l.draftSectionId ||
              fresh.duplicateFlag !== l.duplicateFlag ||
              fresh.genAve !== l.genAve ||
              fresh.applicantType !== l.applicantType
            ) {
              hasChanges = true;
              return {
                ...l,
                ...fresh,
                sectionId: roster.section.id,
                isOverridden: l.isOverridden,
                isNew:
                  fresh.isFinalized && !l.isOverridden
                    ? false
                    : l.isNew !== undefined
                    ? l.isNew
                    : Boolean(l.isOverridden || !fresh.isFinalized),
              };
            }
            return l;
          });
        return buildRoster(roster.section, freshLearners);
      });

      const nextUnplaced: PoolLearner[] = [];
      for (const l of currentDraft.unplacedLearners) {
        if (!poolMap.has(l.applicationId)) {
          hasChanges = true;
          continue;
        }
        if (String(l.gradeLevelId) !== String(currentDraft.gradeLevelId)) {
          hasChanges = true;
          continue;
        }
        const fresh = poolMap.get(l.applicationId)!;
        const targetSectionId = fresh.draftSectionId ?? fresh.finalizedSectionId;
        if (targetSectionId) {
          hasChanges = true;
          existingAppIds.add(fresh.applicationId);
          const targetRoster = nextRosters.find(
            (r) => r.section.id === targetSectionId,
          );
          if (targetRoster) {
            const updatedLearners = [
              ...targetRoster.learners,
              {
                ...fresh,
                sectionId: targetSectionId,
                isOverridden: false,
                isNew: !fresh.isFinalized,
              },
            ];
            const rosterIdx = nextRosters.findIndex(
              (r) => r.section.id === targetSectionId,
            );
            nextRosters[rosterIdx] = buildRoster(
              targetRoster.section,
              updatedLearners,
            );
          }
          continue;
        }
        if (fresh.isFinalized) {
          hasChanges = true;
          continue;
        }
        existingAppIds.add(fresh.applicationId);
        if (
          fresh.status !== l.status ||
          fresh.duplicateFlag !== l.duplicateFlag ||
          fresh.genAve !== l.genAve ||
          fresh.applicantType !== l.applicantType
        ) {
          hasChanges = true;
          nextUnplaced.push({ ...l, ...fresh });
        } else {
          nextUnplaced.push(l);
        }
      }

      const newLearners = poolData.filter(
        (l) =>
          String(l.gradeLevelId) === String(currentDraft.gradeLevelId) &&
          !existingAppIds.has(l.applicationId),
      );
      for (const l of newLearners) {
        const targetSectionId = l.draftSectionId ?? l.finalizedSectionId;
        if (targetSectionId) {
          const targetRoster = nextRosters.find(
            (r) => r.section.id === targetSectionId,
          );
          if (targetRoster) {
            hasChanges = true;
            existingAppIds.add(l.applicationId);
            const freshLearner: DraftLearnerPlacement = {
              ...l,
              sectionId: targetSectionId,
              isOverridden: false,
              isNew: !l.isFinalized,
            };
            const updatedLearners = [...targetRoster.learners, freshLearner];
            const rosterIdx = nextRosters.findIndex(
              (r) => r.section.id === targetSectionId,
            );
            nextRosters[rosterIdx] = buildRoster(
              targetRoster.section,
              updatedLearners,
            );
            continue;
          }
        }
        if (!l.isFinalized) {
          hasChanges = true;
          existingAppIds.add(l.applicationId);
          nextUnplaced.push(l);
        }
      }

      const totalDraftedLearners = nextRosters.reduce(
        (sum, r) => sum + r.learners.length,
        0,
      );
      // If there are no drafted learners in any section, clear the stale draft
      if (totalDraftedLearners === 0) {
        return null;
      }

      // If all learners in rosters are already officially enrolled with no overrides and unplaced is empty,
      // there are no uncommitted draft changes — exit draft mode and show official sections.
      const allRostersOfficiallyEnrolled = nextRosters.every((r) =>
        r.learners.every((l) => l.isFinalized && !l.isOverridden),
      );
      if (allRostersOfficiallyEnrolled && nextUnplaced.length === 0) {
        return null;
      }

      if (hasChanges) {
        return {
          ...currentDraft,
          rosters: nextRosters,
          unplacedLearners: nextUnplaced,
        };
      }
      return currentDraft;
    });
  }, [poolData, poolInitialLoading, setDraftPlacement]);

  const loading =
    (sectionsInitialLoading || poolInitialLoading || gradeLevelsLoading) &&
    !isHistoricalReadOnly;

  const [selectedAppIds, setSelectedAppIds] = useState<Set<number>>(() => new Set());

  const handleToggleSelect = useCallback((applicationId: number) => {
    startTransition(() => {
      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        if (next.has(applicationId)) {
          next.delete(applicationId);
        } else {
          next.add(applicationId);
        }
        return next;
      });
    });
  }, [startTransition]);

  const handleClearSelection = useCallback(() => {
    startTransition(() => {
      setSelectedAppIds(new Set());
    });
  }, [startTransition]);

  const handleSelectAll = useCallback((ids: number[]) => {
    startTransition(() => {
      setSelectedAppIds(new Set(ids));
    });
  }, [startTransition]);

  const [highlightedLearnerId, setHighlightedLearnerId] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const handleFocusDraftLearner = useCallback(
    (applicationId: number, sectionId?: number) => {
      if (sectionId) {
        setExpandedSectionIds((prev) => new Set([...prev, sectionId]));
      }
      setHighlightedLearnerId(applicationId);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      setTimeout(() => {
        const el = document.getElementById(`draft-learner-${applicationId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (sectionId) {
          const secEl = document.getElementById(`section-card-${sectionId}`);
          secEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 120);

      highlightTimerRef.current = setTimeout(() => {
        setHighlightedLearnerId(null);
      }, 2500);
    },
    [],
  );

  type SortConfig = { key: "genAve"; direction: "asc" | "desc" } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: "genAve") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);

  const handleSelectTargetSection = useCallback((sectionId: number) => {
    startTransition(() => {
      setTargetSectionId(sectionId);
    });
  }, [startTransition]);

  const handleToggleExpandedSection = useCallback((sectionId: number) => {
    startTransition(() => {
      setExpandedSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        return next;
      });
    });
  }, [startTransition]);

  useEffect(() => {
    setSelectedAppIds(new Set());
    setDraftMoveAction(null);
    justCommittedRef.current = false;
  }, [activeGradeLevelId]);

  const isDraftActive = draftPlacement !== null;

  useEffect(() => {
    if (!draftPlacement || isHistoricalReadOnly || isCommittingRef.current || justCommittedRef.current) return;

    const handler = setTimeout(async () => {
      try {
        const assignments = draftPlacement.rosters.map(r => ({
          sectionId: r.section.id,
          applicationIds: r.learners.map(l => l.applicationId)
        }));

        await api.post("/sectioning/save-draft", {
          gradeLevelId: draftPlacement.gradeLevelId,
          assignments
        });
      } catch (err) {
        console.error("Autosave failed", err);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [draftPlacement, isHistoricalReadOnly]);
  const _isLockedIn = selectedAppIds.size > 0 || isDraftActive;

  const currentGradeSections = useMemo(() => {
    if (!activeGradeLevelId) return [];
    return sections.filter((s) => {
      if (String(s.gradeLevelId) !== activeGradeLevelId) return false;
      if (s.programType === "SPECIAL_PROGRAM_IN_THE_ARTS" && !spaEnabled) return false;
      if (s.programType === "SPECIAL_PROGRAM_IN_SPORTS" && !spsEnabled) return false;
      if (s.programType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING" && !steEnabled) return false;
      return true;
    });
  }, [sections, activeGradeLevelId, spaEnabled, spsEnabled, steEnabled]);

  useEffect(() => {
    if (currentGradeSections.length > 0) {
      setExpandedSectionIds(new Set(currentGradeSections.map((s) => s.id)));
    }
  }, [activeGradeLevelId, currentGradeSections.length]);

  const currentGradePool = useMemo(() => {
    if (!activeGradeLevelId) return [];
    return pool.filter(
      (p) =>
        String(p.gradeLevelId) === activeGradeLevelId &&
        !p.isFinalized,
    );
  }, [pool, activeGradeLevelId]);
  const draftLearnerCount = useMemo(
    () =>
      draftPlacement?.rosters.reduce(
        (total, roster) => total + roster.learners.length,
        0,
      ) ?? 0,
    [draftPlacement],
  );
  const activeGradeDraftLearnerCount = useMemo(
    () =>
      draftPlacement?.rosters.reduce(
        (total, roster) =>
          total +
          roster.learners.filter(
            (l) => String(l.gradeLevelId) === activeGradeLevelId,
          ).length,
        0,
      ) ?? 0,
    [draftPlacement, activeGradeLevelId],
  );
  const activeGradeUnplacedCount = useMemo(
    () =>
      draftPlacement?.unplacedLearners?.filter(
        (l) =>
          String(l.gradeLevelId) === activeGradeLevelId &&
          !l.isFinalized,
      ).length ?? 0,
    [draftPlacement, activeGradeLevelId],
  );
  const hasDraftOverflow = useMemo(
    () =>
      draftPlacement?.rosters.some((roster) => roster.isOverCapacity) ?? false,
    [draftPlacement],
  );
  const selectedAllowedPrograms = useMemo(() => {
    const selectedLearners = currentGradePool.filter((learner) => selectedAppIds.has(learner.applicationId));
    if (selectedLearners.length === 0) return new Set<ApplicantType>();

    let commonAllowed: ApplicantType[] | null = null;
    for (const learner of selectedLearners) {
      const allowed = getAllowedSectionProgramsForPlacement(learner);
      if (commonAllowed === null) {
        commonAllowed = allowed;
      } else {
        commonAllowed = commonAllowed.filter(p => allowed.includes(p));
      }
    }
    return new Set(commonAllowed ?? []);
  }, [currentGradePool, selectedAppIds]);

  const filteredPool = useMemo(() => {
    return currentGradePool.filter((l) => {
      if (filterProgram !== "all" && l.programType !== filterProgram) return false;
      if (activeSearchQuery) {
        const queryTerms = activeSearchQuery.toLowerCase().replace(/[,.]/g, ' ').split(/\s+/).filter(Boolean);
        const lrn = l.lrn?.toLowerCase() || "";
        const firstName = l.firstName.toLowerCase();
        const lastName = l.lastName.toLowerCase();
        const middleName = (l.middleName || "").toLowerCase();

        // Match all terms against any part of the name or LRN
        const matchesAll = queryTerms.every(term =>
          lrn.includes(term) ||
          firstName.includes(term) ||
          lastName.includes(term) ||
          middleName.includes(term)
        );

        if (!matchesAll) {
          return false;
        }
      }
      return true;
    });
  }, [currentGradePool, activeSearchQuery, filterProgram]);

  const filteredAndSortedPool = useMemo(() => {
    const poolMap = new Map(
      filteredPool
        .filter((l) => String(l.gradeLevelId) === activeGradeLevelId)
        .map((learner) => [learner.applicationId, learner]),
    );
    if (draftPlacement?.unplacedLearners) {
      for (const unplaced of draftPlacement.unplacedLearners) {
        if (
          String(unplaced.gradeLevelId) === activeGradeLevelId &&
          !unplaced.isFinalized &&
          !poolMap.has(unplaced.applicationId)
        ) {
          if (filterProgram !== "all" && unplaced.programType !== filterProgram) continue;
          if (activeSearchQuery) {
            const queryTerms = activeSearchQuery
              .toLowerCase()
              .replace(/[,.]/g, " ")
              .split(/\s+/)
              .filter(Boolean);
            const lrn = unplaced.lrn?.toLowerCase() || "";
            const firstName = unplaced.firstName.toLowerCase();
            const lastName = unplaced.lastName.toLowerCase();
            const middleName = (unplaced.middleName || "").toLowerCase();
            const matchesAll = queryTerms.every(
              (term) =>
                lrn.includes(term) ||
                firstName.includes(term) ||
                lastName.includes(term) ||
                middleName.includes(term),
            );
            if (!matchesAll) continue;
          }
          poolMap.set(unplaced.applicationId, unplaced);
        }
      }
    }
    const result = Array.from(poolMap.values()).filter(
      (learner) => String(learner.gradeLevelId) === activeGradeLevelId,
    );
    if (sortConfig !== null) {
      result.sort((a, b) => {
        if (sortConfig.key === "genAve") {
          const aVal = a.genAve ?? -1;
          const bVal = b.genAve ?? -1;
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }
        return 0;
      });
    }
    return result;
  }, [
    filteredPool,
    sortConfig,
    draftPlacement,
    activeGradeLevelId,
    filterProgram,
    activeSearchQuery,
  ]);

  type VirtualLeftPaneItem =
    | { type: "header"; id: string; title: string }
    | { type: "learner"; id: number; learner: PoolLearner };

  const flatLeftPaneItems: VirtualLeftPaneItem[] = useMemo(() => {
    const becLearners = filteredAndSortedPool.filter((l) => l.programType === "REGULAR");

    const scpGroupsMap = new Map<string, PoolLearner[]>();
    filteredAndSortedPool.forEach((l) => {
      if (l.programType !== "REGULAR") {
        if (!scpGroupsMap.has(l.programType)) scpGroupsMap.set(l.programType, []);
        scpGroupsMap.get(l.programType)!.push(l);
      }
    });

    const getProgramTitle = (pt: string) => {
      const label = SCP_LABELS[pt];
      const acronym = SCP_SHORT_LABELS[pt as keyof typeof SCP_SHORT_LABELS];
      if (label && acronym) return `${label} (${acronym})`;
      return label || pt;
    };

    const scpGroups = Array.from(scpGroupsMap.entries())
      .sort(([a], [b]) => {
        const order = {
          SCIENCE_TECHNOLOGY_AND_ENGINEERING: 1,
          SPECIAL_PROGRAM_IN_THE_ARTS: 2,
          SPECIAL_PROGRAM_IN_SPORTS: 3,
        } as Record<string, number>;
        return (order[a] || 4) - (order[b] || 4);
      })
      .map(([programType, learners]) => ({
        title: getProgramTitle(programType),
        learners,
      }));

    const groups = [
      ...scpGroups,
      { title: "Basic Education Curriculum (BEC)", learners: becLearners },
    ].filter((g) => g.learners.length > 0);

    const items: VirtualLeftPaneItem[] = [];
    for (const group of groups) {
      items.push({ type: "header", id: `header-${group.title}`, title: group.title });
      for (const l of group.learners) {
        items.push({ type: "learner", id: l.applicationId, learner: l });
      }
    }
    return items;
  }, [filteredAndSortedPool]);

  const leftPaneScrollRef = useRef<HTMLDivElement>(null);

  const leftPaneVirtualizer = useVirtualizer({
    count: flatLeftPaneItems.length,
    getScrollElement: () => leftPaneScrollRef.current,
    estimateSize: (index) => (flatLeftPaneItems[index]?.type === "header" ? 44 : 84),
    overscan: 10,
  });

  const leftVirtualItems = leftPaneVirtualizer.getVirtualItems();
  const leftTotalSize = leftPaneVirtualizer.getTotalSize();
  const leftPaddingTop = leftVirtualItems.length > 0 ? leftVirtualItems[0].start : 0;
  const leftPaddingBottom =
    leftVirtualItems.length > 0
      ? leftTotalSize - leftVirtualItems[leftVirtualItems.length - 1].end
      : 0;

  const findDraftLearner = useCallback(
    (applicationId: number) => {
      if (!draftPlacement) return null;
      for (const roster of draftPlacement.rosters) {
        const learner = roster.learners.find(
          (item) => item.applicationId === applicationId,
        );
        if (learner) return learner;
      }
      return null;
    },
    [draftPlacement],
  );

  const displayedRosters = useMemo(() => {
    return currentGradeSections.map((section) => {
      if (draftPlacement) {
        const existingRoster = draftPlacement.rosters.find(
          (r) => r.section.id === section.id,
        );
        if (existingRoster) {
          return {
            ...existingRoster,
            section,
          };
        }
        return buildRoster(section, []);
      }
      return {
        section,
        learners: [],
        genderCounts: {
          boys: section.draftCount ? (section.draftBoys ?? section.boys) : section.boys,
          girls: section.draftCount ? (section.draftGirls ?? section.girls) : section.girls,
        },
        totalCount: section.draftCount ? section.draftCount : section.currentCount,
        newCount: 0,
        isOverCapacity: (section.draftCount || section.currentCount) > section.maxCapacity,
      };
    });
  }, [currentGradeSections, draftPlacement]);

  const draftSectionInfoByApplicationId = useMemo(() => {
    return new Map<number, { sectionId: number; sectionName: string }>(
      draftPlacement?.rosters.flatMap((roster) =>
        roster.learners.map((learner) => [
          learner.applicationId,
          { sectionId: roster.section.id, sectionName: roster.section.name },
        ] as const),
      ) ?? [],
    );
  }, [draftPlacement]);

  const selectedDraftLearner = useMemo(() => {
    return draftMoveAction
      ? findDraftLearner(draftMoveAction.learnerApplicationId)
      : null;
  }, [draftMoveAction, findDraftLearner]);

  const compatibleMoveSections = useMemo(() => {
    if (!selectedDraftLearner || !draftPlacement) return [];
    return (
      draftPlacement.rosters.filter(
        (roster) =>
          roster.section.id !== selectedDraftLearner.sectionId &&
          getAllowedSectionProgramsForPlacement(selectedDraftLearner).includes(
            roster.section.programType,
          ),
      ) ?? []
    );
  }, [selectedDraftLearner, draftPlacement]);

  const normalMoveSourceSection = useMemo(() => {
    return normalMoveAction
      ? (currentGradeSections.find((s) => s.id === normalMoveAction.fromSectionId) ?? null)
      : null;
  }, [normalMoveAction, currentGradeSections]);

  const normalMoveDestinationSections = useMemo(() => {
    return normalMoveAction && normalMoveSourceSection
      ? currentGradeSections.filter(
          (s) =>
            s.id !== normalMoveAction.fromSectionId &&
            s.programType === normalMoveSourceSection.programType,
        )
      : [];
  }, [normalMoveAction, normalMoveSourceSection, currentGradeSections]);

  const groupedCompatibleSwapLearners = useMemo(() => {
    if (!selectedDraftLearner || !draftPlacement) return [];
    return (
      draftPlacement.rosters
        .filter((roster) =>
          getAllowedSectionProgramsForPlacement(selectedDraftLearner).includes(
            roster.section.programType,
          ),
        )
        .map((roster) => ({
          sectionName: roster.section.name,
          programType: roster.section.programType,
          learners: roster.learners
            .filter(
              (learner) =>
                learner.applicationId !== selectedDraftLearner.applicationId,
            )
            .sort((a, b) => {
              const nameA = `${a.lastName}, ${a.firstName}`;
              const nameB = `${b.lastName}, ${b.firstName}`;
              return nameA.localeCompare(nameB);
            }),
        }))
        .filter((group) => group.learners.length > 0)
        .sort((a, b) => a.sectionName.localeCompare(b.sectionName)) ?? []
    );
  }, [selectedDraftLearner, draftPlacement]);

  const assignLearners = async () => {
    if (!targetSectionId || selectedAppIds.size === 0) return;

    const assignedSectionId = targetSectionId;
    setProcessing(true);
    try {
      await api.post("/sectioning/assign-bulk", {
        sectionId: assignedSectionId,
        applicationIds: Array.from(selectedAppIds),
      });

      const sectionName = currentGradeSections.find(
        (s) => s.id === targetSectionId,
      )?.name;
      sileo.success({
        title: "Assignment Successful",
        description: `Assigned ${selectedAppIds.size} learners to ${sectionName}.`,
      });
      setSelectedAppIds(new Set());
      setTargetSectionId(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectioningPool(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectioningSections(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["section-masterlist", assignedSectionId],
        }),
      ]);
    } catch (error: unknown) {
      sileo.error({
        title: "Assignment Failed",
        description:
          (isAxiosError<ApiMessageResponse>(error)
            ? error.response?.data.message
            : undefined) ??
          "An error occurred while moving learners. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const assignSelectedToDraftSection = useCallback((sectionId: number) => {
    if (!draftPlacement || selectedAppIds.size === 0) return;

    const s = draftPlacement.rosters.find((r) => r.section.id === sectionId)?.section;
    if (!s) return;

    startTransition(() => {
      setDraftPlacement((current) => {
        if (!current) return current;

        const movingLearners = current.unplacedLearners.filter((l) =>
          selectedAppIds.has(l.applicationId)
        );
        const remainingUnplaced = current.unplacedLearners.filter(
          (l) => !selectedAppIds.has(l.applicationId)
        );

        const rosters = current.rosters.map((roster) => {
          if (roster.section.id !== sectionId) return roster;

          const newLearners: DraftLearnerPlacement[] = [
            ...roster.learners,
            ...movingLearners.map((l) => ({
              ...l,
              sectionId,
              isOverridden: true,
              isNew: true,
            })),
          ];

          return buildRoster(roster.section, newLearners);
        });

        return {
          ...current,
          unplacedLearners: remainingUnplaced,
          rosters,
        };
      });

      setSelectedAppIds(new Set());
      setTargetSectionId(null);
    });
  }, [draftPlacement, selectedAppIds, startTransition]);

  useEffect(() => {
    if (
      poolInitialLoading ||
      sectionsInitialLoading ||
      draftPlacement ||
      isCommittingRef.current ||
      justCommittedRef.current
    ) {
      return;
    }

    const hasActiveServerDraft = currentGradePool.some(
      (l) => Boolean(l.draftSectionId) && !l.isFinalized,
    );

    if (hasActiveServerDraft) {
      const draft = loadDraftPlacementFromServer(
        Number(activeGradeLevelId),
        currentGradePool,
        currentGradeSections,
        ayId ?? undefined,
      );

      const hasUncommittedChanges =
        draft.unplacedLearners.length > 0 ||
        draft.rosters.some((r) =>
          r.learners.some((l) => !l.isFinalized || l.isOverridden || l.isNew),
        );

      if (!hasUncommittedChanges) {
        return;
      }

      const populatedSectionIds = draft.rosters
        .filter((roster) => roster.learners.length > 0)
        .map((roster) => roster.section.id);

      setDraftPlacement(draft);
      setExpandedSectionIds(new Set(populatedSectionIds));
      setSelectedAppIds(new Set());
      setTargetSectionId(null);
      setAllowCapacityOverride(false);
    }
  }, [currentGradePool, currentGradeSections, draftPlacement, activeGradeLevelId, poolInitialLoading, sectionsInitialLoading, setDraftPlacement, ayId]);

  const generateDraftPlacement = useCallback(async () => {
    if (!activeGradeLevelId || autoAssignPhase !== "idle" || processing) return;

    justCommittedRef.current = false;
    setAutoAssignPhase("loading");

    try {
      const res = await api.get<PoolLearner[]>("/sectioning/pool", {
        params: { gradeLevelId: activeGradeLevelId, includeAssigned: "true" }
      });
      const fullPool = res.data.filter(
        (l) => String(l.gradeLevelId) === activeGradeLevelId,
      );
      const previousRosters = draftPlacement?.rosters;

      let newDraft: DraftPlacement | null = null;

      // Option A (Preferred): Backend server endpoint
      try {
        const backendRes = await api.post<{ success?: boolean; draft?: DraftPlacement } & Partial<DraftPlacement>>(
          "/sectioning/generate-draft",
          {
            gradeLevelId: Number(activeGradeLevelId),
            sections: currentGradeSections.map((s) => ({
              id: s.id,
              name: s.name,
              maxCapacity: s.maxCapacity,
              programType: s.programType,
            })),
            enableHomogeneousSections,
            homogeneousSectionCount,
            heterogeneousRoundRobin,
            topBecHeterogeneousRoundRobin,
            academicYearId: ayId ?? undefined,
          },
        );
        const candidateDraft = backendRes.data?.draft ?? (backendRes.data?.rosters ? (backendRes.data as unknown as DraftPlacement) : null);
        if (candidateDraft && Array.isArray(candidateDraft.rosters)) {
          newDraft = candidateDraft;
        }
      } catch (backendErr) {
        console.warn("Backend draft generation endpoint unavailable, falling back to Web Worker:", backendErr);
      }

      // Option B: Web Worker offloading (if backend unavailable or offline)
      if (!newDraft) {
        newDraft = await runSectioningWithWorker({
          gradeLevelId: Number(activeGradeLevelId),
          learners: fullPool,
          sections: currentGradeSections,
          enableHomogeneousSections,
          homogeneousSectionCount,
          heterogeneousRoundRobin,
          topBecHeterogeneousRoundRobin,
          previousRosters,
          academicYearId: ayId ?? undefined,
        });
      }

      setDraftPlacement(newDraft);
      const populatedSectionIds = newDraft.rosters
        .filter((roster) => roster.learners.length > 0)
        .map((roster) => roster.section.id);
      setExpandedSectionIds(new Set(populatedSectionIds));

      setSelectedAppIds(new Set());
      setTargetSectionId(null);
      setAllowCapacityOverride(false);
      setAutoAssignPhase("resolving");

      const resolutionTimer = setTimeout(() => {
        setAutoAssignPhase("idle");
        sileo.success({
          title: "Draft sections generated successfully.",
          description: "Please review the temporary rosters.",
        });
      }, prefersReducedMotion ? 0 : 600);
      autoAssignTimers.current.push(resolutionTimer);
    } catch (err) {
      console.error("Auto assignment failed", err);
      setAutoAssignPhase("idle");
      sileo.error({
        title: "Auto assignment failed",
        description: "Could not generate temporary sections. Please try again.",
      });
    }
  }, [
    activeGradeLevelId,
    autoAssignPhase,
    processing,
    draftPlacement?.rosters,
    currentGradeSections,
    enableHomogeneousSections,
    homogeneousSectionCount,
    heterogeneousRoundRobin,
    topBecHeterogeneousRoundRobin,
    ayId,
    prefersReducedMotion,
  ]);

  const openMoveDialog = useCallback((
    learnerApplicationId: number,
    fromSectionId: number,
  ) => {
    setDraftMoveAction({ type: "MOVE", learnerApplicationId, fromSectionId });
    setMoveDestinationSectionId("");
  }, []);

  const openNormalMoveDialog = useCallback((
    learnerApplicationId: number,
    fromSectionId: number,
  ) => {
    setNormalMoveAction({ learnerApplicationId, fromSectionId });
    setMoveDestinationSectionId("");
  }, []);

  const openSwapDialog = useCallback((
    learnerApplicationId: number,
    fromSectionId: number,
  ) => {
    setDraftMoveAction({ type: "SWAP", learnerApplicationId, fromSectionId });
    setSwapApplicationId("");
  }, []);

  const executeMove = () => {
    if (!draftPlacement || !draftMoveAction || draftMoveAction.type !== "MOVE")
      return;
    const destinationSectionId = Number(moveDestinationSectionId);
    if (!Number.isInteger(destinationSectionId) || destinationSectionId <= 0)
      return;

    setDraftPlacement((current) => {
      if (!current) return current;

      let movingLearner: DraftLearnerPlacement | null = null;
      const rosters = current.rosters.map((roster) => {
        if (roster.section.id !== draftMoveAction.fromSectionId) return roster;
        const remainingLearners = roster.learners.filter((learner) => {
          if (learner.applicationId !== draftMoveAction.learnerApplicationId)
            return true;
          movingLearner = learner;
          return false;
        });
        return buildRoster(roster.section, remainingLearners);
      });

      if (!movingLearner) return current;
      const learnerToMove = movingLearner as DraftLearnerPlacement;

      const updatedRosters = [...rosters];
      const targetIndex = updatedRosters.findIndex((r) => r.section.id === destinationSectionId);

      if (targetIndex >= 0) {
        updatedRosters[targetIndex] = buildRoster(updatedRosters[targetIndex].section, [
          ...updatedRosters[targetIndex].learners,
          {
            ...learnerToMove,
            sectionId: destinationSectionId,
            isOverridden: true,
            isNew: true,
          },
        ]);
      } else {
        const targetSection = currentGradeSections.find(s => s.id === destinationSectionId);
        if (targetSection) {
          updatedRosters.push(buildRoster(targetSection, [
            {
              ...learnerToMove,
              sectionId: destinationSectionId,
              isOverridden: true,
              isNew: true,
            }
          ]));
        }
      }

      return rebuildDraftPlacement({ ...current, rosters: updatedRosters });
    });

    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      next.add(destinationSectionId);
      return next;
    });

    setDraftMoveAction(null);
    setMoveDestinationSectionId("");
  };

  const executeNormalMove = async () => {
    if (!normalMoveAction) return;
    const destinationSectionId = Number(moveDestinationSectionId);
    if (!Number.isInteger(destinationSectionId) || destinationSectionId <= 0)
      return;

    setProcessing(true);
    try {
      await api.post("/sections/transfer-learner", {
        targetSectionId: destinationSectionId,
        enrollmentApplicationId: normalMoveAction.learnerApplicationId,
      });
      sileo.success({
        title: "Assignment Successful",
        description: "Learner successfully moved to the new section.",
      });
      const oldSectionId = normalMoveAction.fromSectionId;
      setNormalMoveAction(null);
      setMoveDestinationSectionId("");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sectioningSections(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["section-masterlist", oldSectionId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["section-masterlist", destinationSectionId],
      });
    } catch (_error: unknown) {
      sileo.error({
        title: "Move Failed",
        description: "An error occurred while moving the learner. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openRemoveDialog = useCallback((
    learnerApplicationId: number,
    fromSectionId: number,
  ) => {
    setNormalRemoveAction({ learnerApplicationId, fromSectionId });
  }, []);

  const executeNormalRemove = async () => {
    if (!normalRemoveAction) return;

    setProcessing(true);
    try {
      await api.post("/sections/transfer-learner", {
        targetSectionId: null,
        enrollmentApplicationId: normalRemoveAction.learnerApplicationId,
      });
      sileo.success({
        title: "Learner Removed",
        description: "Learner was successfully unassigned and returned to the pool.",
      });
      const oldSectionId = normalRemoveAction.fromSectionId;
      setNormalRemoveAction(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sectioningSections(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sectioningPool(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["section-masterlist", oldSectionId],
      });
    } catch (error: unknown) {
      sileo.error({
        title: "Removal Failed",
        description:
          (isAxiosError<ApiMessageResponse>(error)
            ? error.response?.data.message
            : undefined) ??
          "An error occurred while removing the learner. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openForfeitDialog = useCallback((
    learnerApplicationId: number,
    fromSectionId: number,
  ) => {
    setForfeitAction({ learnerApplicationId, fromSectionId });
  }, []);

  const executeForfeit = async () => {
    if (!forfeitAction) return;

    setProcessing(true);
    try {
      await api.post("/sections/forfeit-slot", {
        enrollmentApplicationId: forfeitAction.learnerApplicationId,
      });
      sileo.success({
        title: "Slot Forfeited",
        description: "Learner slot has been forfeited and application withdrawn.",
      });
      const oldSectionId = forfeitAction.fromSectionId;
      setForfeitAction(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sectioningSections(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sectioningPool(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["section-masterlist", oldSectionId],
      });
    } catch (error) {
      sileo.error({
        title: "Failed to forfeit slot",
        description: getApiMessage(error, "An unexpected error occurred"),
      });
    } finally {
      setProcessing(false);
    }
  };

  const executeSwap = () => {
    if (!draftPlacement || !draftMoveAction || draftMoveAction.type !== "SWAP")
      return;
    const otherApplicationId = Number(swapApplicationId);
    if (!Number.isInteger(otherApplicationId) || otherApplicationId <= 0)
      return;

    setDraftPlacement((current) => {
      if (!current) return current;

      const sourceLearner = findDraftLearner(
        draftMoveAction.learnerApplicationId,
      );
      const otherLearner = findDraftLearner(otherApplicationId);
      if (!sourceLearner || !otherLearner) return current;

      const sourceSectionId = sourceLearner.sectionId;
      const otherSectionId = otherLearner.sectionId;
      const rosters = current.rosters.map((roster) => {
        const swappedLearners = roster.learners.map((learner) => {
          if (learner.applicationId === sourceLearner.applicationId) {
            return {
              ...otherLearner,
              sectionId: sourceSectionId,
              isOverridden: true,
              isNew: true,
            };
          }
          if (learner.applicationId === otherLearner.applicationId) {
            return {
              ...sourceLearner,
              sectionId: otherSectionId,
              isOverridden: true,
              isNew: true,
            };
          }
          return learner;
        });
        return buildRoster(roster.section, swappedLearners);
      });

      return rebuildDraftPlacement({ ...current, rosters });
    });

    setDraftMoveAction(null);
    setSwapApplicationId("");
  };

  const commitDraftPlacement = async () => {
    if (!draftPlacement) return;

    const activeRosters = draftPlacement.rosters.filter((roster) => roster.learners.length > 0);
    const total = activeRosters.length;

    const assignments: CommitDraftAssignment[] = activeRosters.map((roster) => ({
      sectionId: roster.section.id,
      applicationIds: roster.learners.map((learner) => learner.applicationId),
    }));

    if (assignments.length === 0) {
      setCommitDialogOpen(false);
      return;
    }

    const overrides = draftPlacement.rosters.reduce<Record<number, boolean>>(
      (accumulator, roster) => {
        for (const learner of roster.learners) {
          accumulator[learner.applicationId] = learner.isOverridden;
        }
        return accumulator;
      },
      {},
    );

    // Close confirmation dialog immediately so the right pane loading overlay is in full focus
    setCommitDialogOpen(false);
    setCommitProcessing(true);
    isCommittingRef.current = true;
    justCommittedRef.current = true;

    const firstProg = formatSectionProgramLabel(
      activeRosters[0].section.programType,
      activeRosters[0].section.isHomogeneous,
    );
    setFinalizingProgress({
      currentSection: firstProg ? `${firstProg} — ${activeRosters[0].section.name}` : activeRosters[0].section.name,
      completedSections: 0,
      totalSections: total,
    });

    try {
      const commitPromise = api.post<CommitDraftResponse>(
        "/sectioning/commit-draft",
        {
          assignments,
          overrides,
          allowCapacityOverride,
        },
      );

      // Smooth paced stepping through each section being finalized
      for (let i = 0; i < activeRosters.length; i++) {
        const roster = activeRosters[i];
        const prog = formatSectionProgramLabel(
          roster.section.programType,
          roster.section.isHomogeneous,
        );
        setFinalizingProgress({
          currentSection: prog ? `${prog} — ${roster.section.name}` : roster.section.name,
          completedSections: i,
          totalSections: total,
        });
        await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion ? 100 : 600));
      }

      const response = await commitPromise;

      // Show brief 100% completed check state before fading out
      setFinalizingProgress({
        currentSection: "",
        completedSections: total,
        totalSections: total,
        isComplete: true,
      });
      await new Promise((resolve) => setTimeout(resolve, prefersReducedMotion ? 50 : 400));
      const skippedCount = response.data.skippedApplications.length;
      const committedApplicationIds = new Set(
        response.data.committedApplications.map(
          (application) => application.applicationId,
        ),
      );
      const committedPlacements = response.data.committedApplications.flatMap(
        (committedApplication) => {
          const roster = draftPlacement.rosters.find(
            (item) => item.section.id === committedApplication.sectionId,
          );
          const learner = roster?.learners.find(
            (item) =>
              item.applicationId === committedApplication.applicationId,
          );

          return learner
            ? [{ committedApplication, learner }]
            : [];
        },
      );
      const nextSections = sections.map((section) => {
        const additions = committedPlacements.filter(
          ({ committedApplication }) =>
            committedApplication.sectionId === section.id,
        );
        if (additions.length === 0) return section;

        return {
          ...section,
          currentCount: section.currentCount + additions.length,
          boys:
            section.boys +
            additions.filter(({ learner }) => learner.sex === "MALE").length,
          girls:
            section.girls +
            additions.filter(({ learner }) => learner.sex === "FEMALE").length,
        };
      });
      const nextPool = pool.filter(
        (learner) =>
          !committedApplicationIds.has(learner.applicationId) &&
          !learner.isFinalized,
      );

      setSections(nextSections);
      setPool(nextPool);
      queryClient.setQueriesData<SectionSummary[]>(
        { queryKey: queryKeys.sectioningSections() },
        () => nextSections,
      );
      queryClient.setQueriesData<PoolLearner[]>(
        { queryKey: queryKeys.sectioningPool() },
        (current) =>
          current
            ? current.filter(
                (l) =>
                  !committedApplicationIds.has(l.applicationId) &&
                  !l.isFinalized,
              )
            : [],
      );

      const affectedSectionIds = Array.from(
        new Set(
          response.data.committedApplications.map(
            (application) => application.sectionId,
          ),
        ),
      );
      for (const sectionId of affectedSectionIds) {
        const additions: InlineMasterlistLearner[] = committedPlacements
          .filter(
            ({ committedApplication }) =>
              committedApplication.sectionId === sectionId,
          )
          .map(({ committedApplication, learner }) => ({
            id: committedApplication.enrollmentRecordId,
            enrollmentApplicationId: learner.applicationId,
            lrn: learner.lrn,
            firstName: learner.firstName,
            lastName: learner.lastName,
            middleName: learner.middleName,
            sex: learner.sex,
            genAve: learner.genAve,
            status: learner.status === "PENDING_CONFIRMATION" ? "PENDING_CONFIRMATION" : "OFFICIALLY_ENROLLED",
          }));

        queryClient.setQueryData<InlineMasterlistResponse>(
          ["section-masterlist", sectionId],
          (current) => {
            const existingLearners = current?.learners ?? [];
            const existingApplicationIds = new Set(
              existingLearners.map(
                (learner) => learner.enrollmentApplicationId,
              ),
            );

            return {
              learners: [
                ...existingLearners,
                ...additions.filter(
                  (learner) =>
                    !existingApplicationIds.has(
                      learner.enrollmentApplicationId,
                    ),
                ),
              ],
            };
          },
        );
      }

      sileo.success({
        title: "Final Sectioning Committed",
        description:
          skippedCount > 0
            ? `${response.data.committedCount} learner(s) committed. ${skippedCount} learner(s) need review.`
            : `${response.data.committedCount} learner(s) committed to official class sections.`,
      });

      setCommitDialogOpen(false);
      setDraftPlacement(null);

      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          delete parsed[activeGradeLevelId];
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }

      setExpandedSectionIds(new Set());
      setDraftMoveAction(null);
      setMoveDestinationSectionId("");
      setSwapApplicationId("");
      setAllowCapacityOverride(false);
      setSelectedAppIds(new Set());
      setTargetSectionId(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectioningPool(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.sectioningSections(),
        }),
        ...affectedSectionIds.map((sectionId) =>
          queryClient.invalidateQueries({
            queryKey: ["section-masterlist", sectionId],
          }),
        ),
      ]);
      justCommittedRef.current = false;
    } catch (error: unknown) {
      justCommittedRef.current = false;
      sileo.error({
        title: "Draft Commit Failed",
        description:
          (isAxiosError<ApiMessageResponse>(error)
            ? error.response?.data.message
            : undefined) ?? "Could not commit the draft sectioning placements.",
      });
    } finally {
      isCommittingRef.current = false;
      setCommitProcessing(false);
      setFinalizingProgress(null);
    }
  };

  const handleExportGradeLevel = async (format: "pdf" | "xlsx") => {
    if (!activeGradeLevelId) return;
    setIsExporting(true);
    try {
      const response = await api.get(
        `/sections/grade-level/${activeGradeLevelId}/export/${format}`,
        {
          responseType: "blob",
          params: { schoolYearId: ayId },
        },
      );
      const mimeType =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([response.data], { type: mimeType });
      const currentGradeObj = gradeLevels.find((g) => String(g.id) === activeGradeLevelId);
      const safeGrade = (currentGradeObj?.name || `Grade_${activeGradeLevelId}`).replace(/\s+/g, "_");
      const safeSy = (ayLabel || "SY").replace(/\s+/g, "_").replace("/", "-");
      const filename = `${safeGrade}_Masterlist_${safeSy}.${format}`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();

      sileo.success({
        title: "Export Ready",
        description: `Successfully downloaded ${currentGradeObj?.name || "Grade Level"} Masterlist (${format.toUpperCase()}).`,
      });
    } catch (err: unknown) {
      console.error("Grade level masterlist export error:", err);
      sileo.error({
        title: "Export Failed",
        description: "Could not export the grade level masterlist. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleRightPaneFullscreen = useCallback(() => {
    setIsRightPaneFullscreen((current) => !current);
  }, []);

  const handleTriggerReRun = useCallback(() => {
    if (sections.some((s) => s.currentCount > 0)) {
      setReRunWarningOpen(true);
    } else {
      generateDraftPlacement();
    }
  }, [sections, generateDraftPlacement]);

  const handleDiscardDraft = useCallback(() => {
    startTransition(() => {
      setDraftPlacement(null);
      setSelectedAppIds(new Set());
      setTargetSectionId(null);
    });
    sileo.info({
      title: "Draft discarded",
      description: "Returned to official class sections.",
    });
  }, [startTransition, setDraftPlacement]);

  const renderInlineSectionTable = useCallback(
    (sectionId: number) => (
      <InlineSectionTable
        sectionId={sectionId}
        onMoveLearner={!isHistoricalReadOnly ? openNormalMoveDialog : undefined}
        onRemoveLearner={!isHistoricalReadOnly ? openRemoveDialog : undefined}
        onForfeitSlot={!isHistoricalReadOnly ? openForfeitDialog : undefined}
      />
    ),
    [isHistoricalReadOnly, openNormalMoveDialog, openRemoveDialog, openForfeitDialog],
  );

  if (masterlistModalSectionId !== null) {
    return (
      <ViewMasterlist
        sectionId={masterlistModalSectionId}
        onBack={() => setMasterlistModalSectionId(null)}
        mode="sectioning"
      />
    );
  }

  if (loading) {
    return <TwoPanelSkeleton />;
  }

  const sectioningLoadError = sectionsError ?? poolError;
  if (sectioningLoadError) {
    return (
      <Card className="flex min-h-[420px] flex-col items-center justify-center gap-4 border-border p-8 text-center shadow-sm">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="space-y-1">
          <CardTitle className="text-xl">Unable to load Section Assignment</CardTitle>
          <CardDescription className="text-base text-foreground">
            {getApiMessage(sectioningLoadError, "Could not load learners and sections.")}
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={() => {
            void Promise.all([refetchSections(), refetchPool()]);
          }}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden">
      <Tabs
        value={activeGradeLevelId}
        onValueChange={(val) => {
          if (autoAssignPhase !== "idle" || commitProcessing || Boolean(finalizingProgress)) return;
          startTransition(() => {
            if (isDraftActive) {
              setActiveGradeLevelId(val);
              return;
            }

            if (selectedAppIds.size === 0) {
              setActiveGradeLevelId(val);
            }
          });
        }}
      >
        <TabsList className="w-full flex flex-wrap sm:flex-nowrap h-auto gap-1 mb-4 p-1 bg-muted border border-border rounded-xl relative shadow-sm">
          {gradeLevels.map((g) => {
            const isActive = activeGradeLevelId === String(g.id);
            const isDisabled =
              commitProcessing ||
              Boolean(finalizingProgress) ||
              (selectedAppIds.size > 0 &&
                !isDraftActive &&
                !isActive);

            return (
              <TabsTrigger
                key={g.id}
                value={String(g.id)}
                disabled={isDisabled}
                className={cn(
                  "flex-1 min-w-32 font-bold transition-all relative z-10 rounded-lg uppercase text-base data-[state=active]:shadow-sm",
                  getGradeLevelActiveTabStyles(g.name),
                  isActive
                    ? getGradeLevelSolidBgStyles(g.name)
                    : "data-[state=inactive]:bg-transparent text-foreground",
                  isDisabled && "opacity-40 cursor-not-allowed bg-muted/20",
                )}>
                {isActive && (
                  <motion.div
                    layoutId="enrollment-grade-pill"
                    className={cn(
                      "absolute inset-0 shadow-sm rounded-lg",
                      getGradeLevelSolidBgStyles(g.name),
                    )}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-20 uppercase text-base font-bold transition-colors",
                    isActive
                      ? "text-white font-extrabold"
                      : "text-foreground",
                  )}>
                  {g.name.replace(/grade\s*/i, "Grade ")}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* ── Workspace ── */}
      <PageTransition key={activeGradeLevelId} className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        <Card className="flex flex-col flex-1 min-h-0 h-full shadow-sm border-none bg-card overflow-hidden">
          {/* Mobile Segment Switcher */}
          {isMobile && (
            <div className="p-2 border-b border-border bg-muted/40 flex items-center justify-center shrink-0">
              <div className="grid grid-cols-2 w-full gap-1 p-1 bg-background rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setMobileSectioningView("queue")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase rounded-md transition-all",
                    mobileSectioningView === "queue"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>Queue ({filteredPool.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSectioningView("sections")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold uppercase rounded-md transition-all",
                    mobileSectioningView === "sections"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Sections ({displayedRosters.length})</span>
                </button>
              </div>
            </div>
          )}

          <div className={cn("relative flex flex-1 min-h-0 w-full overflow-hidden", isTablet && "flex-col overflow-y-auto")}>
            <AnimatePresence>
              {finalizingProgress && (
                <FinalizingSectionLoader
                  currentSection={finalizingProgress.currentSection}
                  completedSections={finalizingProgress.completedSections}
                  totalSections={finalizingProgress.totalSections}
                  isComplete={finalizingProgress.isComplete}
                />
              )}
            </AnimatePresence>

            {/* LEFT PANE: UNSECTIONED POOL */}
            <div
              className={cn(
                "flex flex-col border-r border-border bg-card text-card-foreground transition-[width,opacity] duration-300 ease-linear",
                autoAssignPhase !== "idle" && "pointer-events-none opacity-55",
                isDesktop && "absolute inset-y-0 left-0 sm:flex-none",
                isTablet && "w-full min-h-[440px] max-h-[520px] overflow-y-auto border-b border-r-0 shrink-0",
                isMobile && (mobileSectioningView === "queue" ? "w-full h-full overflow-y-auto flex-1" : "hidden"),
              )}
              aria-busy={autoAssignPhase !== "idle"}
              style={
                isDesktop ? { width: `${panelPercentage}vw` } : undefined
              }
            >
              <CardHeader className="border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold uppercase flex flex-wrap items-center gap-2 text-foreground">
                      <Users className="h-5 w-5 text-primary shrink-0" />
                      <span>LEARNERS READY FOR SECTIONING</span>
                      {isDraftActive && activeGradeDraftLearnerCount > 0 && (
                        <Badge className="border border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-100 font-bold px-2 py-0.5 text-xs">
                          {activeGradeDraftLearnerCount} IN DRAFT
                        </Badge>
                      )}
                      {isDraftActive && activeGradeUnplacedCount > 0 && (
                        <Badge variant="outline" className="font-bold border-amber-500 text-amber-700 bg-amber-50 px-2 py-0.5 text-xs">
                          {activeGradeUnplacedCount} UNPLACED
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-foreground">
                      {isDraftActive
                        ? "Temporary placements generated — review or finalize in the class lists pane"
                        : "Unassigned Walk-ins, Transferees, and Late Enrollees"}
                    </CardDescription>
                  </div>
                  {selectedAppIds.size > 0 && (
                    <Badge
                      variant="outline"
                      className="font-bold bg-background border-border">
                      {selectedAppIds.size} Selected
                    </Badge>
                  )}
                </div>
                <WorkspaceSearchInput
                  onSearchChange={setActiveSearchQuery}
                  filterProgram={filterProgram}
                  onFilterProgramChange={setFilterProgram}
                />
              </CardHeader>
              <div ref={leftPaneScrollRef} className="p-0 relative flex-1 overflow-auto max-h-[calc(100vh-270px)]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-muted z-20 border-b border-border shadow-sm">
                    <tr className="uppercase h-14">
                      <th className="px-4 w-10">
                        <Checkbox
                          className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          checked={
                            selectedAppIds.size === filteredPool.length &&
                            filteredPool.length > 0
                          }
                          disabled={
                            isDraftActive || autoAssignPhase !== "idle" ||
                            (selectedAllowedPrograms?.size === 0 &&
                              new Set(filteredPool.map((l) => l.programType)).size > 1)
                          }
                          onCheckedChange={(checked) => {
                            if (isDraftActive) return;
                            if (checked) {
                              const targetProgram =
                                selectedAllowedPrograms?.size > 0
                                  ? Array.from(selectedAllowedPrograms)[0]
                                  : null;
                              handleSelectAll(
                                filteredPool
                                  .filter(
                                    (l) =>
                                      !targetProgram ||
                                      l.programType === targetProgram
                                  )
                                  .map((l) => l.applicationId)
                              );
                            } else {
                              handleClearSelection();
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 font-bold">Learner Detail</th>
                      <th
                        className="px-4 cursor-pointer select-none font-bold"
                        onClick={() => handleSort("genAve")}>
                        <div className="flex items-center gap-1 justify-center">
                          Final Gen Ave
                          {sortConfig?.key === "genAve" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-primary" />
                            ))}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-base leading-tight bg-card text-center">
                    {filteredAndSortedPool.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="h-[400px] text-center text-muted-foreground ">
                          <div className="flex flex-col items-center justify-center h-full space-y-3">
                            {activeSearchQuery || filterProgram !== "all" ? (
                              <>
                                <Search className="h-8 w-8" />
                                <p className="text-foreground font-extrabold">No unsectioned learners match this search</p>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-8 w-8 text-primary" />
                                <p className="text-foreground font-extrabold">No pending unassigned learners.</p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {leftPaddingTop > 0 && (
                          <tr>
                            <td colSpan={3} style={{ height: `${leftPaddingTop}px` }} />
                          </tr>
                        )}
                        {leftVirtualItems.map((virtualRow) => {
                          const item = flatLeftPaneItems[virtualRow.index];
                          if (!item) return null;
                          if (item.type === "header") {
                            return (
                              <tr key={item.id} data-index={virtualRow.index}>
                                <td
                                  colSpan={3}
                                  className="sticky top-14 z-10 py-2.5 px-4 bg-muted/95 backdrop-blur-sm text-center font-bold text-foreground uppercase tracking-wider border-y shadow-sm"
                                >
                                  {item.title}
                                </td>
                              </tr>
                            );
                          }
                          const l = item.learner;
                          const isSelected = selectedAppIds.has(l.applicationId);
                          const draftInfo = draftSectionInfoByApplicationId.get(l.applicationId);
                          const isDraftPlaced = Boolean(draftPlacement && draftInfo);
                          const draftSectionName = draftInfo?.sectionName;
                          const draftTargetSectionId = draftInfo?.sectionId;

                          const isDisabled =
                            isDraftActive ||
                            autoAssignPhase !== "idle" ||
                            (selectedAllowedPrograms?.size > 0 &&
                              !selectedAllowedPrograms?.has(l.programType));

                          return (
                            <LearnerReadyRow
                              key={l.applicationId}
                              learner={l}
                              isSelected={isSelected}
                              isDisabled={isDisabled}
                              isDraftPlaced={isDraftPlaced}
                              draftSectionName={draftSectionName}
                              draftTargetSectionId={draftTargetSectionId}
                              autoAssignPhase={autoAssignPhase}
                              onToggleSelect={handleToggleSelect}
                              onFocusDraftLearner={handleFocusDraftLearner}
                            />
                          );
                        })}
                        {leftPaddingBottom > 0 && (
                          <tr>
                            <td colSpan={3} style={{ height: `${leftPaddingBottom}px` }} />
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DRAG HANDLE */}
            <div
              onMouseDown={startResizingRight}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sectioning panes"
              className={cn(
                "hidden lg:flex absolute inset-y-0 w-[12px] -translate-x-1/2 cursor-col-resize z-50 hover:bg-primary/20 transition-opacity items-center justify-center group bg-transparent shrink-0",
                isRightPaneFullscreen && "pointer-events-none opacity-0",
              )}
              style={
                isDesktop
                  ? {
                      left: `calc(${panelPercentage}vw + 1px)`,
                    }
                  : undefined
              }
            >
              <div className="absolute left-[-3px] right-[-3px] top-0 bottom-0 z-10" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/70 shadow-sm z-20" />
            </div>

            {/* RIGHT PANE: AVAILABLE SECTIONS */}
            <SectionCardsPane
              isDesktop={isDesktop}
              isTablet={isTablet}
              isMobile={isMobile}
              mobileSectioningView={mobileSectioningView}
              panelPercentage={panelPercentage}
              isRightPaneFullscreen={isRightPaneFullscreen}
              onToggleFullscreen={toggleRightPaneFullscreen}
              isHistoricalReadOnly={isHistoricalReadOnly}
              isExporting={isExporting}
              onExportGradeLevel={handleExportGradeLevel}
              poolLength={currentGradePool.length}
              sectionsCount={currentGradeSections.length}
              processing={processing}
              autoAssignPhase={autoAssignPhase}
              onTriggerReRun={handleTriggerReRun}
              onOpenHowSystemPlaces={() => setAutoAssignConfirmOpen(true)}
              displayedRosters={displayedRosters}
              draftPlacement={draftPlacement}
              selectedAllowedPrograms={selectedAllowedPrograms}
              selectedAppIdsCount={selectedAppIds.size}
              targetSectionId={targetSectionId}
              expandedSectionIds={expandedSectionIds}
              onToggleExpandedSection={handleToggleExpandedSection}
              onSelectTargetSection={handleSelectTargetSection}
              onOpenMasterlistModal={setMasterlistModalSectionId}
              prefersReducedMotion={prefersReducedMotion}
              highlightedLearnerId={highlightedLearnerId}
              openMoveDialog={openMoveDialog}
              openSwapDialog={openSwapDialog}
              openNormalMoveDialog={openNormalMoveDialog}
              openRemoveDialog={openRemoveDialog}
              openForfeitDialog={openForfeitDialog}
              onAssignSelectedToDraftSection={assignSelectedToDraftSection}
              onDiscardDraft={handleDiscardDraft}
              onOpenCommitDialog={() => setCommitDialogOpen(true)}
              commitProcessing={commitProcessing}
              draftLearnerCount={draftLearnerCount}
              onAssignLearners={assignLearners}
              targetSectionName={targetSectionId ? (sections.find((s) => s.id === targetSectionId)?.name ?? "") : ""}
              renderInlineSectionTable={renderInlineSectionTable}
            />
          </div>
        </Card>
      </PageTransition>

      <Dialog
        open={draftMoveAction?.type === "MOVE"}
        onOpenChange={(open) => !open && setDraftMoveAction(null)}>
        <DialogContent className="w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>Move to Section</DialogTitle>
            <DialogDescription>
              Move the learner to another compatible section in this draft.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={moveDestinationSectionId}
            onValueChange={setMoveDestinationSectionId}>
            <SelectTrigger className="h-11 font-bold">
              <SelectValue placeholder="Select destination section" />
            </SelectTrigger>
            <SelectContent>
              {compatibleMoveSections.map((roster) => (
                <SelectItem
                  key={roster.section.id}
                  value={String(roster.section.id)}>
                  {roster.section.name} ({roster.totalCount}/
                  {roster.section.maxCapacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDraftMoveAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={executeMove}
              disabled={!moveDestinationSectionId}>
              Move to Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!normalMoveAction}
        onOpenChange={(open) => !open && setNormalMoveAction(null)}
        title="Move Assigned Learner"
        description={
          <div className="space-y-4 text-left w-full mt-4">
            <p className="text-foreground text-center">
              Move the learner to another section in the current grade level.
            </p>
            <Select
              value={moveDestinationSectionId}
              onValueChange={setMoveDestinationSectionId}>
              <SelectTrigger className="h-11 font-bold w-full">
                <SelectValue placeholder="Select destination section" />
              </SelectTrigger>
              <SelectContent>
                {normalMoveDestinationSections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={String(section.id)}>
                    {section.name} ({section.currentCount}/
                    {section.maxCapacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        confirmText="Move to Section"
        onConfirm={executeNormalMove}
        loading={processing}
        confirmDisabled={!moveDestinationSectionId}
        variant="primary"
      />

      <ConfirmationModal
        open={reRunWarningOpen}
        onOpenChange={setReRunWarningOpen}
        title="Re-run Sectioning Algorithm?"
        description="Warning: This will clear all current draft sections and re-sort all pre-registered and enrolled learners. Are you sure you want to reset the rosters?"
        confirmText="Proceed"
        cancelText="Cancel"
        onConfirm={() => {
          setReRunWarningOpen(false);
          generateDraftPlacement();
        }}
        variant="danger"
      />

      <ConfirmationModal
        open={!!normalRemoveAction}
        onOpenChange={(open) => !open && setNormalRemoveAction(null)}
        title="Unassign Learner"
        description="Are you sure you want to unassign this learner from the section? The learner will be returned to the pool of unsectioned learners."
        confirmText="Unassign Learner"
        cancelText="Cancel"
        onConfirm={executeNormalRemove}
        loading={processing}
        variant="danger"
      />

      <ConfirmationModal
        open={!!forfeitAction}
        onOpenChange={(open) => !open && setForfeitAction(null)}
        title="Remove / Forfeit Slot"
        description="Are you sure you want to forfeit this slot? The learner's enrollment application will be marked as WITHDRAWN and they will be removed from this section."
        confirmText="Forfeit Slot"
        cancelText="Cancel"
        onConfirm={executeForfeit}
        loading={processing}
        variant="danger"
      />

      <Dialog
        open={draftMoveAction?.type === "SWAP"}
        onOpenChange={(open) => !open && setDraftMoveAction(null)}>
        <DialogContent className="w-full max-w-3xl">
          <DialogHeader>
            <DialogTitle>Swap Section</DialogTitle>
            <DialogDescription>
              Exchange this learner with another compatible learner in the
              draft.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={swapApplicationId}
            onValueChange={setSwapApplicationId}>
            <SelectTrigger className="h-11 font-bold">
              <SelectValue placeholder="Select learner to swap" />
            </SelectTrigger>
            <SelectContent>
              {groupedCompatibleSwapLearners.map((group) => (
                <SelectGroup key={group.sectionName}>
                  <SelectLabel className="bg-muted text-primary/80 border-y uppercase">
                    {(SCP_LABELS[group.programType] || group.programType)} - {group.sectionName}
                  </SelectLabel>
                  {group.learners.map((learner) => (
                    <SelectItem
                      key={learner.applicationId}
                      value={String(learner.applicationId)}>
                      {formatLearnerName(learner)} -{" "}
                      {learner.genAve?.toFixed(2) ?? "No Gen Ave"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDraftMoveAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={executeSwap}
              disabled={!swapApplicationId}>
              Swap Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={autoAssignConfirmOpen}
        onOpenChange={setAutoAssignConfirmOpen}
        title="AUTO ASSIGN TEMPORARY SECTIONS"
        align="center"
        variant="primary"
        showClose={true}
        confirmText="Got it"
        cancelText={isAnimationVisible ? "Hide Animation" : "View Animation"}
        onCancel={() => setIsAnimationVisible(!isAnimationVisible)}
        onConfirm={() => setAutoAssignConfirmOpen(false)}
        className="transition-all duration-300 !max-w-5xl"
        confirmClassName={currentGradePool.length < 10 ? "w-full" : undefined}
        description={
          <div className={cn("grid gap-6 mt-4", isAnimationVisible ? "grid-cols-2" : "grid-cols-1")}>
            {/* Left Column: Text instructions */}
            <div className="space-y-4 text-left">
              <p className="text-center font-bold text-base">
                This will create temporary class lists for the selected grade level.
              </p>
              <div className="space-y-3">
                <p className="font-bold text-foreground text-sm">
                  How the system will place learners:
                </p>
                <ul className="list-disc space-y-2 pl-5 leading-relaxed text-foreground text-sm">
                  <li
                    className={cn("transition-colors cursor-pointer hover:opacity-80", isAnimationVisible && animationScene === 0 ? "font-bold text-primary" : "")}
                    onClick={() => { if (isAnimationVisible) setAnimationScene(0); }}
                  >
                    Phase 1: Gathering all enrolled learners and their previous End-of-School Year (EOSY) grades.
                  </li>
                  {(() => {
                    const availableScp = Array.from(
                      new Set(currentGradeSections.filter((s) => s.programType !== "REGULAR").map((s) => s.programType))
                    );

                    return (
                      <>
                        <li
                          className={cn("transition-colors cursor-pointer hover:opacity-80", isAnimationVisible && animationScene === 1 ? "font-bold text-primary" : "")}
                          onClick={() => { if (isAnimationVisible) setAnimationScene(1); }}
                        >
                          Phase 2: Assigning qualified learners to Special Curricular Programs (SCP){availableScp.length > 0 ? ` like ${availableScp.map((p) => SCP_SHORT_LABELS[p] || p).join(", ")}` : " (none currently available)"}.
                        </li>
                        {enableHomogeneousSections && (
                          <li
                            className={cn("transition-colors cursor-pointer hover:opacity-80", isAnimationVisible && animationScene === 2 ? "font-bold text-primary" : "")}
                            onClick={() => { if (isAnimationVisible) setAnimationScene(2); }}
                          >
                            Phase 3: Grouping top-performing learners into Pilot/Top sections {topBecHeterogeneousRoundRobin ? "evenly to balance gender and academic averages." : "homogeneously based on strict academic ranking."}
                          </li>
                        )}
                      </>
                    );
                  })()}
                  <li
                    className={cn("transition-colors cursor-pointer hover:opacity-80", isAnimationVisible && animationScene === 3 ? "font-bold text-primary" : "")}
                    onClick={() => { if (isAnimationVisible) setAnimationScene(3); }}
                  >
                    Phase {enableHomogeneousSections ? 4 : 3}: Distributing the remaining learners {heterogeneousRoundRobin ? "heterogeneously across regular sections to balance gender and academic averages." : "homogeneously by strictly ranking them by final general average."}
                  </li>
                  <li className="text-foreground">
                    After this, you can still review, move, or swap learners before clicking Finalize Official Sections.
                  </li>
                </ul>
              </div>
              <div className="font-bold text-primary mt-4 p-3 bg-primary/5 rounded-md border-2 border-primary text-sm text-center">
                Please review the temporary class lists carefully before finalizing because finalization creates the official section records.
              </div>
            </div>

            {/* Right Column: Animation container */}
            {isAnimationVisible && !prefersReducedMotion && (
              <div className="h-[450px]">
                {(() => {
                  const isMock = filteredAndSortedPool.length < 10;

                  const allRegular = currentGradeSections.filter(s => s.programType === "REGULAR");
                  const topSectionCount = enableHomogeneousSections ? Math.min(allRegular.length, homogeneousSectionCount) : 0;
                  const topSections = allRegular.filter(s => s.isHomogeneous).slice(0, topSectionCount);
                  const topSectionIds = new Set(topSections.map(s => s.id));
                  const regularSections = allRegular.filter(s => !topSectionIds.has(s.id));

                  const scp = { ste: 0, spa: 0, sps: 0 };
                  let becTotal = 0;
                  let topBecCount = 0;

                  if (isMock) {
                    let remaining = 30;
                    const hasSte = currentGradeSections.some(s => s.programType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING");
                    const hasSpa = currentGradeSections.some(s => s.programType === "SPECIAL_PROGRAM_IN_THE_ARTS");
                    const hasSps = currentGradeSections.some(s => s.programType === "SPECIAL_PROGRAM_IN_SPORTS");

                    if (hasSte && remaining > 0) { scp.ste = Math.min(5, remaining); remaining -= scp.ste; }
                    if (hasSpa && remaining > 0) { scp.spa = Math.min(5, remaining); remaining -= scp.spa; }
                    if (hasSps && remaining > 0) { scp.sps = Math.min(5, remaining); remaining -= scp.sps; }

                    becTotal = remaining;

                    if (topSections.length > 0) {
                      topBecCount = Math.min(Math.ceil(becTotal / 3), becTotal);
                    }
                  } else {
                    filteredAndSortedPool.forEach(l => {
                      if (l.programType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING") scp.ste++;
                      else if (l.programType === "SPECIAL_PROGRAM_IN_THE_ARTS") scp.spa++;
                      else if (l.programType === "SPECIAL_PROGRAM_IN_SPORTS") scp.sps++;
                      else if (l.programType === "REGULAR") becTotal++;
                    });

                    const totalSections = topSections.length + regularSections.length;
                    const targetPerSection = totalSections > 0 ? Math.ceil(becTotal / totalSections) : 0;
                    const maxAvailableTopCapacity = topSections.reduce((acc, sec) => acc + Math.max(0, sec.maxCapacity - sec.currentCount), 0);
                    const balancedTopCapacity = targetPerSection * topSections.length;

                    const totalTopCapacity = Math.min(balancedTopCapacity, maxAvailableTopCapacity);

                    const eligibleForTop = filteredAndSortedPool.filter(l => l.programType === "REGULAR" && l.academicStatus !== "CONDITIONALLY_PROMOTED");
                    topBecCount = Math.min(eligibleForTop.length, totalTopCapacity);
                  }

                  const stats = {
                    totalLearners: isMock ? 30 : filteredAndSortedPool.length,
                    scp,
                    topBec: { count: topBecCount, sections: topSections.length, sectionNames: topSections.map(s => s.name) },
                    regularBec: { count: becTotal - topBecCount, sections: regularSections.length, sectionNames: regularSections.map(s => s.name) }
                  };

                  return <AutoAssignVisualizer
                    scene={animationScene}
                    poolStats={stats}
                    isPaused={isAnimationPaused}
                    onTogglePause={() => setIsAnimationPaused(!isAnimationPaused)}
                    onNext={handleNextScene}
                    onPrev={handlePrevScene}
                  />;
                })()}
              </div>
            )}
            {isAnimationVisible && prefersReducedMotion && (
              <div className="h-[400px]">
                <div className="bg-slate-50 border-b p-2 text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Reduced Motion Active — Final Distribution State
                </div>
                {(() => {
                  const isMock = filteredAndSortedPool.length < 10;

                  const allRegular = currentGradeSections.filter(s => s.programType === "REGULAR");
                  const topSectionCount = enableHomogeneousSections ? Math.min(allRegular.length, homogeneousSectionCount) : 0;
                  const topSections = allRegular.filter(s => s.isHomogeneous).slice(0, topSectionCount);
                  const topSectionIds = new Set(topSections.map(s => s.id));
                  const regularSections = allRegular.filter(s => !topSectionIds.has(s.id));

                  const scp = { ste: 0, spa: 0, sps: 0 };
                  let becTotal = 0;
                  let topBecCount = 0;

                  if (isMock) {
                    let remaining = 30;
                    const hasSte = currentGradeSections.some(s => s.programType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING");
                    const hasSpa = currentGradeSections.some(s => s.programType === "SPECIAL_PROGRAM_IN_THE_ARTS");
                    const hasSps = currentGradeSections.some(s => s.programType === "SPECIAL_PROGRAM_IN_SPORTS");

                    if (hasSte && remaining > 0) { scp.ste = Math.min(5, remaining); remaining -= scp.ste; }
                    if (hasSpa && remaining > 0) { scp.spa = Math.min(5, remaining); remaining -= scp.spa; }
                    if (hasSps && remaining > 0) { scp.sps = Math.min(5, remaining); remaining -= scp.sps; }

                    becTotal = remaining;

                    if (topSections.length > 0) {
                      topBecCount = Math.min(Math.ceil(becTotal / 3), becTotal);
                    }
                  } else {
                    filteredAndSortedPool.forEach(l => {
                      if (l.programType === "SCIENCE_TECHNOLOGY_AND_ENGINEERING") scp.ste++;
                      else if (l.programType === "SPECIAL_PROGRAM_IN_THE_ARTS") scp.spa++;
                      else if (l.programType === "SPECIAL_PROGRAM_IN_SPORTS") scp.sps++;
                      else if (l.programType === "REGULAR") becTotal++;
                    });

                    const totalSections = topSections.length + regularSections.length;
                    const targetPerSection = totalSections > 0 ? Math.ceil(becTotal / totalSections) : 0;
                    const maxAvailableTopCapacity = topSections.reduce((acc, sec) => acc + Math.max(0, sec.maxCapacity - sec.currentCount), 0);
                    const balancedTopCapacity = targetPerSection * topSections.length;

                    const totalTopCapacity = Math.min(balancedTopCapacity, maxAvailableTopCapacity);

                    const eligibleForTop = filteredAndSortedPool.filter(l => l.programType === "REGULAR" && l.academicStatus !== "CONDITIONALLY_PROMOTED");
                    topBecCount = Math.min(eligibleForTop.length, totalTopCapacity);
                  }

                  const stats = {
                    totalLearners: isMock ? 30 : filteredAndSortedPool.length,
                    scp,
                    topBec: { count: topBecCount, sections: topSections.length, sectionNames: topSections.map(s => s.name) },
                    regularBec: { count: becTotal - topBecCount, sections: regularSections.length, sectionNames: regularSections.map(s => s.name) }
                  };

                  return <AutoAssignVisualizer scene={3} poolStats={stats} />;
                })()}
              </div>
            )}
          </div>
        }
      />

      <ConfirmationModal
        open={commitDialogOpen}
        onOpenChange={setCommitDialogOpen}
        title="FINALIZE OFFICIAL SECTIONS"
        description={
          <div className="space-y-4">
            <p className="text-foreground text-sm">
              This action will lock the assignments and update the official school records.
            </p>
            {draftLearnerCount > 0 ? (
              <div className="rounded-md border bg-white overflow-hidden flex flex-col text-left">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-center items-center">
                  <p className="text-base leading-tight font-bold text-foreground">
                    {draftLearnerCount} Learner(s) Selected
                  </p>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 backdrop-blur-sm z-20 border-b shadow-sm">
                      <tr>
                        <th className="h-10 px-4 text-left font-bold text-foreground">Learner Name & LRN</th>
                        <th className="h-10 px-4 text-center font-bold text-foreground">Curricular Program</th>
                        <th className="h-10 px-4 text-center font-bold text-foreground">Grade Level & Proposed Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (!draftPlacement?.rosters) return null;

                        const groups = new Map<string, typeof draftPlacement.rosters>();

                        draftPlacement.rosters.forEach(roster => {
                          let groupKey: string = roster.section.programType;
                          if (groupKey === "REGULAR") {
                            groupKey = roster.section.isHomogeneous ? "TOP_BEC" : "BEC";
                          }
                          if (!groups.has(groupKey)) {
                            groups.set(groupKey, []);
                          }
                          groups.get(groupKey)!.push(roster);
                        });

                        const order = [
                          "SCIENCE_TECHNOLOGY_AND_ENGINEERING",
                          "SPECIAL_PROGRAM_IN_SPORTS",
                          "SPECIAL_PROGRAM_IN_THE_ARTS",
                          "SPECIAL_PROGRAM_IN_JOURNALISM",
                          "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE",
                          "LATE_ENROLLEE",
                          "TOP_BEC",
                          "BEC"
                        ];

                        const getGroupLabel = (key: string) => {
                          if (key === "TOP_BEC") return "Top Basic Education Curriculum";
                          if (key === "BEC") return "Basic Education Curriculum";
                          return SCP_LABELS[key] || key;
                        };

                        return order.flatMap((key) => {
                          const rostersInGroup = groups.get(key);
                          if (!rostersInGroup || rostersInGroup.length === 0) return [];

                          const totalLearners = rostersInGroup.reduce((sum, roster) => sum + roster.learners.length, 0);
                          if (totalLearners === 0) return [];

                          const rows: React.ReactNode[] = [];

                          rows.push(
                            <tr key={`group-${key}`}>
                              <td colSpan={3} className="sticky top-[41px] z-10 bg-muted px-4 py-2 text-center font-bold text-foreground uppercase border-b shadow-sm">
                                {getGroupLabel(key)}
                              </td>
                            </tr>
                          );

                          let learnerIndex = 0;
                          rostersInGroup.forEach((roster) => {
                            roster.learners.forEach((learner) => {
                              rows.push(
                                <tr key={learner.applicationId} className={cn("border-b last:border-0 hover:bg-muted/60 transition-colors", learnerIndex % 2 === 0 ? "bg-background" : "bg-muted/50")}>
                                  <td className="p-3 px-4">
                                    <p className="font-extrabold uppercase text-foreground">
                                      {learner.lastName}, {learner.firstName}
                                      {learner.middleName ? ` ${learner.middleName.charAt(0)}.` : ""}
                                    </p>
                                    <p className="text-sm text-foreground">
                                      LRN: {learner.lrn || "No LRN"}
                                    </p>
                                  </td>
                                  <td className="p-3 px-4 text-center">
                                    <Badge variant="secondary" className="font-bold uppercase">
                                      {SCP_SHORT_LABELS[learner.programType] ?? learner.programType}
                                    </Badge>
                                  </td>
                                  <td className="p-3 px-4 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <Badge
                                        variant="outline"
                                        className={cn("font-bold uppercase", getGradeLevelBadgeStyles(roster.section.gradeLevel))}
                                      >
                                        {formatGradeLevel(roster.section.gradeLevel)}
                                      </Badge>
                                      <div className="font-bold uppercase">
                                        {roster.section.name}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                              learnerIndex++;
                            });
                          });

                          return rows;
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {hasDraftOverflow && (
              <label className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 cursor-pointer">
                <Checkbox
                  checked={allowCapacityOverride}
                  onCheckedChange={(checked) =>
                    setAllowCapacityOverride(checked === true)
                  }
                  className="mt-1 bg-white"
                />
                <span className="text-sm font-bold">
                  Allow capacity override for sections marked over capacity.
                </span>
              </label>
            )}
          </div>
        }
        onConfirm={commitDraftPlacement}
        confirmText="Commit Final Sectioning"
        loading={commitProcessing}
        confirmDisabled={hasDraftOverflow && !allowCapacityOverride}
        variant="primary"
      />
    </div>
  );
}
