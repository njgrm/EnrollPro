import React from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import { UserPhoto } from "@/shared/components/UserPhoto";
import { cn } from "@/shared/lib/utils";
import type { PoolLearner } from "../types/sectioning.types";
import type { ApplicantType } from "@enrollpro/shared";

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

export interface LearnerReadyRowProps {
  learner: PoolLearner;
  isSelected: boolean;
  isDisabled: boolean;
  isDraftPlaced: boolean;
  draftSectionName?: string;
  draftTargetSectionId?: number;
  autoAssignPhase: string;
  onToggleSelect: (applicationId: number) => void;
  onFocusDraftLearner?: (applicationId: number, targetSectionId?: number) => void;
}

export const LearnerReadyRow = React.memo(function LearnerReadyRow({
  learner,
  isSelected,
  isDisabled,
  isDraftPlaced,
  draftSectionName,
  draftTargetSectionId,
  autoAssignPhase,
  onToggleSelect,
  onFocusDraftLearner,
}: LearnerReadyRowProps) {
  const handleClickRow = () => {
    if (isDraftPlaced && draftTargetSectionId) {
      onFocusDraftLearner?.(learner.applicationId, draftTargetSectionId);
      return;
    }
    if (isDisabled) return;
    onToggleSelect(learner.applicationId);
  };

  return (
    <tr
      data-learner-id={learner.applicationId}
      onClick={handleClickRow}
      title={
        isDraftPlaced
          ? `Assigned to ${draftSectionName} (Draft). Click to view in Temporary Class Lists.`
          : undefined
      }
      className={cn(
        "group transition-[opacity,transform,background-color] duration-300",
        isDraftPlaced
          ? "opacity-80 hover:opacity-100 bg-muted/20 cursor-pointer"
          : isDisabled
          ? "cursor-not-allowed"
          : "cursor-pointer",
        autoAssignPhase === "resolving" &&
          isDraftPlaced &&
          "scale-[0.99] opacity-80",
        isSelected && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <td
        className="p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isDraftPlaced ? (
          <span
            className="inline-flex cursor-not-allowed"
            title={`Assigned to draft section: ${draftSectionName}`}
          >
            <Checkbox
              checked={false}
              disabled={true}
              aria-label={`Assigned to draft section ${draftSectionName}`}
            />
          </span>
        ) : (
          <Checkbox
            checked={isSelected}
            disabled={isDisabled}
            onCheckedChange={() => {
              if (isDisabled) return;
              onToggleSelect(learner.applicationId);
            }}
          />
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <UserPhoto
            photo={learner.studentPhoto}
            containerClassName="w-12 h-12 rounded-full shadow-sm border shrink-0 border-2 border-primary"
            className="w-full h-full object-cover"
            alt={`${learner.firstName} ${learner.lastName}`}
            firstName={learner.firstName}
            lastName={learner.lastName}
            loading="lazy"
            decoding="async"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-foreground uppercase flex items-center">
              {learner.lastName}, {learner.firstName}{" "}
              {learner.middleName?.charAt(0)
                ? `${learner.middleName.charAt(0)}.`
                : ""}
              {learner.duplicateFlag && (
                <Badge
                  variant="destructive"
                  className="text-sm px-1 py-0 h-4"
                >
                  DUPLICATE DETECTED - RESOLVE OVER COUNTER
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold uppercase text-foreground">
                {learner.lrn || "NO LRN"}
              </span>
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
              {learner.programType === "LATE_ENROLLEE" && (
                <Badge
                  variant="outline"
                  className="text-sm uppercase font-bold bg-amber-100 text-amber-700 border-amber-500 border-2"
                >
                  {SCP_SHORT_LABELS[learner.programType] ?? learner.programType}
                </Badge>
              )}
            </div>
            {isDraftPlaced && (
              <span className="text-sm font-bold uppercase text-amber-700 dark:text-amber-400 text-left flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Section: {draftSectionName} (Draft)
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 font-bold text-foreground">
        {learner.genAve ? (
          learner.genAve.toFixed(2)
        ) : (
          <span className="text-foreground">--</span>
        )}
      </td>
    </tr>
  );
});
