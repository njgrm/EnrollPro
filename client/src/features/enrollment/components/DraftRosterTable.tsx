import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { MoreHorizontal, MoveRight, ArrowRightLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { DraftLearnerPlacement } from "../types/sectioning.types";
import { formatLearnerName } from "../services/sectioningAlgorithm";

interface DraftRosterTableProps {
  learners: DraftLearnerPlacement[];
  sectionId: number;
  highlightedLearnerId: number | null;
  onOpenMoveDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  onOpenSwapDialog: (learnerApplicationId: number, fromSectionId: number) => void;
}

interface DraftRosterRowProps {
  learner: DraftLearnerPlacement;
  index: number;
  sectionId: number;
  isHighlighted: boolean;
  onOpenMoveDialog: (learnerApplicationId: number, fromSectionId: number) => void;
  onOpenSwapDialog: (learnerApplicationId: number, fromSectionId: number) => void;
}

const DraftRosterRow = React.memo(function DraftRosterRow({
  learner,
  index,
  sectionId,
  isHighlighted,
  onOpenMoveDialog,
  onOpenSwapDialog,
}: DraftRosterRowProps) {
  return (
    <tr
      id={`draft-learner-${learner.applicationId}`}
      className={cn(
        "hover:bg-muted/60 transition-all duration-300",
        index % 2 === 0 ? "bg-background" : "bg-muted/50",
        isHighlighted && "ring-2 ring-primary bg-primary/10 shadow-md font-semibold",
      )}
    >
      <td className="p-3">
        <div className="flex flex-col">
          <span className="font-bold uppercase text-foreground">
            {formatLearnerName(learner)}
          </span>
          <span className="font-bold uppercase text-foreground">
            {learner.lrn ?? "NO LRN"}
            {learner.isOverridden && (
              <Badge className="!text-[11px] ml-2 bg-amber-600 text-white hover:bg-amber-600">
                Added Manually
              </Badge>
            )}
            {learner.isNew && (
              <Badge className="!text-[11px] ml-2 bg-emerald-600 text-white hover:bg-emerald-600">
                NEW
              </Badge>
            )}
          </span>
        </div>
      </td>
      <td className="p-3 font-bold text-center">
        <Badge
          className={cn(
            "px-2",
            learner.sex === "MALE"
              ? "bg-blue-600/10 text-blue-600 border-blue-600 border-2"
              : "bg-pink-600/10 text-pink-600 border-pink-600 border-2",
          )}
        >
          {learner.sex === "MALE" ? "M" : "F"}
        </Badge>
      </td>
      <td className="p-2 text-center">
        <Badge
          className={cn(
            "px-2 uppercase",
            learner.status === "OFFICIALLY_ENROLLED"
              ? "bg-green-600 text-white hover:bg-green-600 border-green-600"
              : learner.status === "PENDING_CONFIRMATION"
              ? "bg-amber-500 text-white hover:bg-amber-500 border-amber-500"
              : "bg-muted text-muted-foreground border-muted hover:bg-muted",
          )}
        >
          {learner.status === "OFFICIALLY_ENROLLED"
            ? "Enrolled"
            : learner.status === "PENDING_CONFIRMATION"
            ? "Pending Confirmation"
            : "Pre-Registered"}
        </Badge>
      </td>
      <td className="p-3 font-bold text-center">
        {learner.genAve ? learner.genAve.toFixed(2) : "--"}
      </td>
      <td className="p-3 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100]">
            <DropdownMenuItem
              onClick={() => onOpenMoveDialog(learner.applicationId, sectionId)}
            >
              <MoveRight className="mr-2 h-4 w-4" />
              Move to Section
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOpenSwapDialog(learner.applicationId, sectionId)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Swap Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
});

export function DraftRosterTable({
  learners,
  sectionId,
  highlightedLearnerId,
  onOpenMoveDialog,
  onOpenSwapDialog,
}: DraftRosterTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isVirtualized = learners.length > 8;

  const rowVirtualizer = useVirtualizer({
    count: isVirtualized ? learners.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 58,
    overscan: 5,
  });

  if (learners.length === 0) {
    return (
      <div
        className="mt-4 overflow-x-auto rounded-md border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted text-foreground">
            <tr className="uppercase">
              <th className="p-3 font-bold">Learner</th>
              <th className="p-3 text-center font-bold">Sex</th>
              <th className="p-3 text-center font-bold">Status</th>
              <th className="p-3 text-center font-bold">Gen Ave</th>
              <th className="p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center font-bold text-foreground"
              >
                No drafted learners in this section.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

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
        "mt-4 overflow-x-auto rounded-md border bg-card",
        isVirtualized && "max-h-[360px] overflow-y-auto relative",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className={cn("bg-muted text-foreground", isVirtualized && "sticky top-0 z-10 shadow-xs")}>
          <tr className="uppercase">
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
                const learner = learners[virtualRow.index];
                if (!learner) return null;
                return (
                  <DraftRosterRow
                    key={learner.applicationId}
                    learner={learner}
                    index={virtualRow.index}
                    sectionId={sectionId}
                    isHighlighted={highlightedLearnerId === learner.applicationId}
                    onOpenMoveDialog={onOpenMoveDialog}
                    onOpenSwapDialog={onOpenSwapDialog}
                  />
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td colSpan={5} style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </>
          ) : (
            learners.map((learner, index) => (
              <DraftRosterRow
                key={learner.applicationId}
                learner={learner}
                index={index}
                sectionId={sectionId}
                isHighlighted={highlightedLearnerId === learner.applicationId}
                onOpenMoveDialog={onOpenMoveDialog}
                onOpenSwapDialog={onOpenSwapDialog}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
