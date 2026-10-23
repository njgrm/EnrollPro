import React, { useMemo, useState, useEffect } from "react";
import {
  LayoutGrid,
  Loader2,
  Download,
  FileDown,
  FileSpreadsheet,
  Minimize2,
  Maximize2,
  Info,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn, SCP_LABELS } from "@/shared/lib/utils";
import type { ApplicantType } from "@enrollpro/shared";
import type { DraftPlacement, DraftSectionRoster } from "../types/sectioning.types";
import { DraftRosterTable } from "./DraftRosterTable";

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

function AnimatedCount({ from, to, animate }: { from: number; to: number; animate: boolean }) {
  const [value, setValue] = useState(animate ? from : to);

  useEffect(() => {
    if (!animate) return;

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 400, 1);
      setValue(Math.round(from + (to - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, from, to]);

  return <>{animate ? value : to}</>;
}

export interface SectionCardsPaneProps {
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  mobileSectioningView: "queue" | "sections";
  panelPercentage: number;
  isRightPaneFullscreen: boolean;
  onToggleFullscreen: () => void;
  isHistoricalReadOnly: boolean;
  isExporting: boolean;
  onExportGradeLevel: (format: "pdf" | "xlsx") => void;
  poolLength: number;
  sectionsCount: number;
  processing: boolean;
  autoAssignPhase: "idle" | "loading" | "resolving";
  onTriggerReRun: () => void;
  onOpenHowSystemPlaces: () => void;
  displayedRosters: DraftSectionRoster[];
  draftPlacement: DraftPlacement | null;
  selectedAllowedPrograms: Set<ApplicantType>;
  selectedAppIdsCount: number;
  targetSectionId: number | null;
  expandedSectionIds: Set<number>;
  onToggleExpandedSection: (sectionId: number) => void;
  onSelectTargetSection: (sectionId: number) => void;
  onOpenMasterlistModal: (sectionId: number) => void;
  prefersReducedMotion: boolean | null;
  highlightedLearnerId: number | null;
  openMoveDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  openSwapDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  openNormalMoveDialog?: (learnerApplicationId: number, fromSectionId: number) => void;
  openRemoveDialog?: (learnerApplicationId: number, fromSectionId: number) => void;
  openForfeitDialog?: (learnerApplicationId: number, fromSectionId: number) => void;
  onAssignSelectedToDraftSection: (sectionId: number) => void;
  onDiscardDraft: () => void;
  onOpenCommitDialog: () => void;
  commitProcessing: boolean;
  draftLearnerCount: number;
  onAssignLearners: () => void;
  targetSectionName: string;
  renderInlineSectionTable?: (sectionId: number) => React.ReactNode;
}

interface SectionCardItemProps {
  roster: DraftSectionRoster;
  draftPlacement: DraftPlacement | null;
  targetSectionId: number | null;
  isExpanded: boolean;
  isProgramCompatible: boolean;
  autoAssignPhase: "idle" | "loading" | "resolving";
  selectedAppIdsCount: number;
  prefersReducedMotion: boolean | null;
  highlightedLearnerId: number | null;
  isHistoricalReadOnly: boolean;
  onCardClick: () => void;
  openMoveDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  openSwapDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  onAssignSelectedToDraftSection: (sectionId: number) => void;
  renderInlineSectionTable?: (sectionId: number) => React.ReactNode;
}

const SectionCardItem = React.memo(function SectionCardItem({
  roster,
  draftPlacement,
  targetSectionId,
  isExpanded,
  isProgramCompatible,
  autoAssignPhase,
  selectedAppIdsCount,
  prefersReducedMotion,
  highlightedLearnerId,
  onCardClick,
  openMoveDialog,
  openSwapDialog,
  onAssignSelectedToDraftSection,
  renderInlineSectionTable,
}: SectionCardItemProps) {
  const s = roster.section;
  const isSelected = !draftPlacement && targetSectionId === s.id;

  return (
    <div
      id={`section-card-${s.id}`}
      onClick={onCardClick}
      className={cn(
        "group cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden",
        autoAssignPhase === "loading" && roster.learners.length === 0 && "animate-pulse bg-muted/50",
        autoAssignPhase !== "idle" && "pointer-events-none",
        !isProgramCompatible && "cursor-not-allowed opacity-45",
        isSelected
          ? "bg-primary/5 border-primary shadow-xs"
          : "bg-background hover:bg-muted/50 border-border",
        draftPlacement && isExpanded && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4
            className={cn(
              "font-extrabold text-xl uppercase transition-colors flex items-center gap-2 flex-wrap",
              isSelected ? "text-primary" : "text-foreground",
            )}
          >
            {s.name}
            {s.isHomogeneous && s.programType === "REGULAR" && (
              <Badge
                variant="outline"
                className="text-xs font-bold uppercase bg-blue-50 text-blue-700 border-blue-200 shrink-0"
              >
                Top BEC
              </Badge>
            )}
          </h4>
          <span className="text-sm uppercase text-foreground font-bold">
            Adviser: {s.adviser || "No Adviser Assigned"}
          </span>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {draftPlacement && roster.isOverCapacity && (
            <Badge variant="destructive" className="text-sm font-bold uppercase">
              Over Capacity
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="text-foreground uppercase">Learner Count</span>
          <span className="text-foreground">
            <AnimatedCount
              from={s.currentCount}
              to={roster.totalCount}
              animate={autoAssignPhase === "resolving" && !prefersReducedMotion}
            />{" "}
            Learners
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-foreground">
          <Badge className="bg-blue-600/10 text-blue-600 border-blue-600 border-2 px-2 gap-1 flex items-center">
            M:{" "}
            <AnimatedCount
              from={s.boys}
              to={roster.genderCounts.boys}
              animate={autoAssignPhase === "resolving" && !prefersReducedMotion}
            />
          </Badge>
          <Badge className="bg-pink-600/10 text-pink-600 border-pink-600 border-2 px-2 gap-1 flex items-center">
            F:{" "}
            <AnimatedCount
              from={s.girls}
              to={roster.genderCounts.girls}
              animate={autoAssignPhase === "resolving" && !prefersReducedMotion}
            />
          </Badge>
          {draftPlacement && (
            <motion.span
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.15 }}
            >
              <Badge className="border border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-100">
                DRAFT: {roster.totalCount}
              </Badge>
            </motion.span>
          )}
          {draftPlacement && (roster.newCount ?? 0) > 0 && (
            <motion.span
              title={`${roster.newCount} new learner${roster.newCount === 1 ? "" : "s"} inserted during re-run.`}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.2 }}
            >
              <Badge className="border border-emerald-500 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold px-2 gap-0.5 cursor-default">
                +
                <AnimatedCount
                  from={0}
                  to={roster.newCount!}
                  animate={autoAssignPhase === "resolving" && !prefersReducedMotion}
                />{" "}
                NEW
              </Badge>
            </motion.span>
          )}
        </div>
      </div>

      {draftPlacement && isExpanded && (
        <DraftRosterTable
          learners={roster.learners}
          sectionId={s.id}
          highlightedLearnerId={highlightedLearnerId}
          onOpenMoveDialog={openMoveDialog}
          onOpenSwapDialog={openSwapDialog}
        />
      )}

      {!draftPlacement && s.currentCount > 0 && renderInlineSectionTable && (
        renderInlineSectionTable(s.id)
      )}

      {draftPlacement && selectedAppIdsCount > 0 && isProgramCompatible && (
        <div className="mt-4">
          <Button
            className="w-full text-base font-bold uppercase"
            onClick={(e) => {
              e.stopPropagation();
              onAssignSelectedToDraftSection(s.id);
            }}
          >
            Add Selected Here
          </Button>
        </div>
      )}
    </div>
  );
});

export const SectionCardsPane = React.memo(function SectionCardsPane({
  isDesktop,
  isTablet,
  isMobile,
  mobileSectioningView,
  panelPercentage,
  isRightPaneFullscreen,
  onToggleFullscreen,
  isHistoricalReadOnly,
  isExporting,
  onExportGradeLevel,
  poolLength,
  sectionsCount,
  processing,
  autoAssignPhase,
  onTriggerReRun,
  onOpenHowSystemPlaces,
  displayedRosters,
  draftPlacement,
  selectedAllowedPrograms,
  selectedAppIdsCount,
  targetSectionId,
  expandedSectionIds,
  onToggleExpandedSection,
  onSelectTargetSection,
  onOpenMasterlistModal,
  prefersReducedMotion,
  highlightedLearnerId,
  openMoveDialog,
  openSwapDialog,
  onAssignSelectedToDraftSection,
  onDiscardDraft,
  onOpenCommitDialog,
  commitProcessing,
  draftLearnerCount,
  onAssignLearners,
  targetSectionName,
  renderInlineSectionTable,
}: SectionCardsPaneProps) {
  const groupedRosters = useMemo(() => {
    const scpRosters = displayedRosters
      .filter((r) => r.section.programType !== "REGULAR")
      .filter(
        (r) =>
          draftPlacement ||
          selectedAllowedPrograms?.size === 0 ||
          selectedAllowedPrograms?.has(r.section.programType)
      );

    const scpRostersByProgram = new Map<string, typeof scpRosters>();
    scpRosters.forEach((r) => {
      if (!scpRostersByProgram.has(r.section.programType)) {
        scpRostersByProgram.set(r.section.programType, []);
      }
      scpRostersByProgram.get(r.section.programType)!.push(r);
    });

    const getProgramTitle = (pt: string) => {
      const label = SCP_LABELS[pt];
      const acronym = SCP_SHORT_LABELS[pt as keyof typeof SCP_SHORT_LABELS];
      if (label && acronym) return `${label} (${acronym})`;
      return label || pt;
    };

    const scpGroups = Array.from(scpRostersByProgram.entries())
      .sort(([a], [b]) => {
        const order = {
          SCIENCE_TECHNOLOGY_AND_ENGINEERING: 1,
          SPECIAL_PROGRAM_IN_THE_ARTS: 2,
          SPECIAL_PROGRAM_IN_SPORTS: 3,
        } as Record<string, number>;
        return (order[a] || 4) - (order[b] || 4);
      })
      .map(([programType, rosters]) => ({
        title: getProgramTitle(programType),
        rosters: rosters.sort((a, b) => a.section.name.localeCompare(b.section.name)),
      }));

    const becRosters = displayedRosters
      .filter((r) => r.section.programType === "REGULAR")
      .filter(
        (r) =>
          draftPlacement ||
          selectedAllowedPrograms?.size === 0 ||
          selectedAllowedPrograms?.has(r.section.programType)
      )
      .sort((a, b) => {
        if (selectedAllowedPrograms?.has("REGULAR") || selectedAllowedPrograms?.size === 0) {
          if (a.section.isHomogeneous && !b.section.isHomogeneous) return -1;
          if (!a.section.isHomogeneous && b.section.isHomogeneous) return 1;
        }
        return a.section.name.localeCompare(b.section.name);
      });

    return [
      ...scpGroups,
      {
        title: "Basic Education Curriculum (BEC)",
        rosters: becRosters,
      },
    ].filter((group) => group.rosters.length > 0);
  }, [displayedRosters, draftPlacement, selectedAllowedPrograms]);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 bg-card text-card-foreground border-border overflow-hidden relative",
        isDesktop && "absolute inset-y-0 right-0 sm:flex-none",
        isTablet && "w-full flex-1 overflow-y-auto min-h-[500px]",
        isMobile && (mobileSectioningView === "sections" ? "w-full h-full overflow-y-auto flex-1" : "hidden"),
      )}
      style={
        isDesktop
          ? {
              left: isRightPaneFullscreen ? "0" : `calc(${panelPercentage}vw + 1px)`,
            }
          : undefined
      }
    >
      <CardHeader className="border-b border-border bg-muted/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-extrabold uppercase flex items-center gap-2 text-foreground">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {draftPlacement ? "TEMPORARY CLASS LISTS" : "Available Sections"}
            </CardTitle>
            <CardDescription className="text-foreground text-sm">
              {draftPlacement
                ? "Please review the temporary assignments before creating the official lists"
                : `Select section to assign ${selectedAppIdsCount || "0"} ${selectedAppIdsCount <= 1 ? "learner" : "learners"}.`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {poolLength === 0 && !draftPlacement && sectionsCount > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    className="font-bold text-xs uppercase tracking-normal gap-1.5 h-9"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Download className="h-4 w-4 text-primary" />
                    )}
                    Export Grade Level
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => onExportGradeLevel("pdf")}
                    className="font-bold text-xs cursor-pointer gap-2 py-2 group group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    <FileDown className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                    Download Masterlist (PDF)
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onExportGradeLevel("xlsx")}
                    className="font-bold text-xs cursor-pointer gap-2 py-2 group group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 group-hover:text-primary-foreground" />
                    Download Masterlist (XLSX)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isDesktop && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={isRightPaneFullscreen ? "Restore split pane" : "Expand section list"}
                aria-label={isRightPaneFullscreen ? "Restore split pane" : "Expand section list"}
                aria-pressed={isRightPaneFullscreen}
                onClick={onToggleFullscreen}
                className="shrink-0"
              >
                {isRightPaneFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {poolLength > 0 && (
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant="default"
              disabled={processing || autoAssignPhase !== "idle" || isHistoricalReadOnly}
              onClick={onTriggerReRun}
              className="w-full font-bold text-base uppercase tracking-normal gap-2 rounded-md"
            >
              {autoAssignPhase !== "idle" && <Loader2 className="h-4 w-4 animate-spin" />}
              {autoAssignPhase !== "idle"
                ? "Running Sectioning Algorithm..."
                : "RE-RUN SECTIONING ALGORITHM"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={autoAssignPhase !== "idle"}
              onClick={onOpenHowSystemPlaces}
              className="h-auto px-2 text-sm font-bold text-primary hover:text-primary"
            >
              <Info className="h-3.5 w-3.5" />
              How does the system place learners?
            </Button>
          </div>
        )}
      </CardHeader>

      <div className="p-4 space-y-3 relative flex-1 overflow-y-auto">
        {displayedRosters.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col gap-3 text-foreground">
            <Info className="h-8 w-8" />
            <span className="font-bold text-base leading-tight">
              No sections defined for this grade.
            </span>
          </div>
        ) : (
          groupedRosters.map((group, groupIdx) => (
            <div key={group.title} className={cn("space-y-3", groupIdx > 0 && "mt-6")}>
              <h3 className="text-center font-extrabold text-foreground uppercase">
                {group.title}
              </h3>
              {group.rosters.map((roster) => {
                const s = roster.section;
                const isExpanded = expandedSectionIds.has(s.id);
                const isProgramCompatible =
                  selectedAllowedPrograms?.size === 0 ||
                  (selectedAllowedPrograms?.size === 1 &&
                    selectedAllowedPrograms?.has(s.programType));

                const handleCardClick = () => {
                  if (autoAssignPhase !== "idle") return;
                  if (draftPlacement) {
                    onToggleExpandedSection(s.id);
                    return;
                  }

                  if (selectedAppIdsCount > 0) {
                    if (isProgramCompatible) {
                      onSelectTargetSection(s.id);
                    }
                  } else {
                    if (s.currentCount > 0) {
                      onOpenMasterlistModal(s.id);
                    } else if (isProgramCompatible) {
                      onSelectTargetSection(s.id);
                    }
                  }
                };

                return (
                  <SectionCardItem
                    key={s.id}
                    roster={roster}
                    draftPlacement={draftPlacement}
                    targetSectionId={targetSectionId}
                    isExpanded={isExpanded}
                    isProgramCompatible={isProgramCompatible}
                    autoAssignPhase={autoAssignPhase}
                    selectedAppIdsCount={selectedAppIdsCount}
                    prefersReducedMotion={prefersReducedMotion}
                    highlightedLearnerId={highlightedLearnerId}
                    isHistoricalReadOnly={isHistoricalReadOnly}
                    onCardClick={handleCardClick}
                    openMoveDialog={openMoveDialog}
                    openSwapDialog={openSwapDialog}
                    onAssignSelectedToDraftSection={onAssignSelectedToDraftSection}
                    renderInlineSectionTable={renderInlineSectionTable}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {(draftPlacement || selectedAppIdsCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="p-4 border-t border-border bg-muted/20 w-full shrink-0"
          >
            {draftPlacement ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDiscardDraft}
                  disabled={commitProcessing || autoAssignPhase !== "idle" || isHistoricalReadOnly}
                  className="h-12 font-bold uppercase border-destructive text-destructive hover:bg-destructive/10"
                >
                  Discard Draft
                </Button>
                <Button
                  onClick={onOpenCommitDialog}
                  disabled={
                    commitProcessing ||
                    autoAssignPhase !== "idle" ||
                    draftLearnerCount === 0 ||
                    isHistoricalReadOnly
                  }
                  className="flex-1 h-12 text-base font-bold uppercase"
                >
                  FINALIZE OFFICIAL SECTIONS
                </Button>
              </div>
            ) : (
              <Button
                onClick={onAssignLearners}
                disabled={
                  selectedAppIdsCount === 0 ||
                  !targetSectionId ||
                  processing ||
                  isHistoricalReadOnly
                }
                className={cn(
                  "w-full h-12 text-base leading-tight font-bold uppercase transition-all shadow-none",
                  selectedAppIdsCount > 0 && targetSectionId
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted",
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign to Section ${targetSectionName} (${selectedAppIdsCount})`
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
