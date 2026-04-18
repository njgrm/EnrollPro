import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { RegularSectionOption } from "./types";

interface PipelineBatchRegularSectionAssignmentProps {
  loading: boolean;
  isBatchProcessing: boolean;
  sections: RegularSectionOption[];
  selectedSectionId: string;
  selectedGradeLevelLabel: string | null;
  hasMixedGradeLevels: boolean;
  requiredSlots: number;
  onSelectSection: (value: string) => void;
  onReload: () => void;
}

export default function PipelineBatchRegularSectionAssignment({
  loading,
  isBatchProcessing,
  sections,
  selectedSectionId,
  selectedGradeLevelLabel,
  hasMixedGradeLevels,
  requiredSlots,
  onSelectSection,
  onReload,
}: PipelineBatchRegularSectionAssignmentProps) {
  const selectedSection = sections.find(
    (section) => String(section.id) === selectedSectionId,
  );

  const availableSlots = selectedSection
    ? Math.max(0, selectedSection.maxCapacity - selectedSection.enrolledCount)
    : 0;

  const willOverflow =
    Boolean(selectedSection) &&
    requiredSlots > 0 &&
    requiredSlots > availableSlots;

  const normalizedFillPercent = Math.min(
    100,
    Math.max(0, Number(selectedSection?.fillPercent ?? 0)),
  );

  const fillColorClass =
    normalizedFillPercent >= 90
      ? "bg-red-500"
      : normalizedFillPercent >= 75
        ? "bg-orange-400"
        : normalizedFillPercent >= 50
          ? "bg-yellow-400"
          : "bg-emerald-500";

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
        <p className="text-xs font-bold text-foreground">
          Regular Enrollment Lane
        </p>
        <p className="text-sm font-bold text-foreground">
          Select one regular section for this verified batch.
        </p>
        <p className="text-xs font-bold text-foreground">
          Selected grade level: {selectedGradeLevelLabel ?? "Not detected"}
        </p>
      </div>

      {hasMixedGradeLevels && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-bold text-destructive">
            Mixed grade levels detected. Select applicants from one grade level
            before assigning a section.
          </p>
        </div>
      )}

      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-foreground">
            Available Regular Sections
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            onClick={onReload}
            disabled={loading || isBatchProcessing}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="size-3.5 mr-1.5" />
            )}
            Reload
          </Button>
        </div>

        <Select
          value={selectedSectionId}
          onValueChange={onSelectSection}
          disabled={
            loading ||
            isBatchProcessing ||
            hasMixedGradeLevels ||
            sections.length === 0
          }>
          <SelectTrigger className="h-10 text-sm font-bold">
            <SelectValue placeholder="Select regular section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem
                key={section.id}
                value={String(section.id)}
                className="text-sm font-bold">
                {section.gradeLevelName} - {section.name} (
                {section.enrolledCount}/{section.maxCapacity})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {sections.length === 0 && !loading && (
          <p className="text-xs font-bold text-destructive">
            No regular sections available for the selected grade level.
          </p>
        )}
      </div>

      {selectedSection && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">
              {selectedSection.gradeLevelName} - {selectedSection.name}
            </p>
            <Badge variant="secondary" className="text-[10px]">
              {selectedSection.enrolledCount}/{selectedSection.maxCapacity}
            </Badge>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${fillColorClass}`}
              style={{ width: `${normalizedFillPercent}%` }}
            />
          </div>

          <p className="text-xs font-bold text-foreground">
            Available slots: {availableSlots} | Requested assignments:{" "}
            {requiredSlots}
          </p>

          {willOverflow ? (
            <p className="text-xs font-bold text-destructive">
              Capacity exceeded. Select another section before submitting.
            </p>
          ) : (
            <p className="text-xs font-bold text-emerald-700">
              Capacity check passed for this batch.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
