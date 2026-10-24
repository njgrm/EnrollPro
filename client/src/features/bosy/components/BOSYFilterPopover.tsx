import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";

export interface BOSYFilterPopoverProps {
  targetGrade: string;
  curricularProgram: string;
  previousSectionName: string;
  assignedTargetGradeOrder: string | null;
  previousSections: string[];
  activeFilterCount: number;
  onApplyFilters: (filters: {
    targetGrade: string;
    curricularProgram: string;
    previousSectionName: string;
  }) => void;
  onClearFilters: () => void;
}

export const BOSYFilterPopover = React.memo(function BOSYFilterPopover({
  targetGrade,
  curricularProgram,
  previousSectionName,
  assignedTargetGradeOrder,
  previousSections,
  activeFilterCount,
  onApplyFilters,
  onClearFilters,
}: BOSYFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localTargetGrade, setLocalTargetGrade] = useState<string>(targetGrade);
  const [localCurricularProgram, setLocalCurricularProgram] = useState<string>(curricularProgram);
  const [localPreviousSectionName, setLocalPreviousSectionName] = useState<string>(previousSectionName);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalTargetGrade(targetGrade);
      setLocalCurricularProgram(curricularProgram);
      setLocalPreviousSectionName(previousSectionName);
    }
  };

  const handleClear = () => {
    const defaultGrade = assignedTargetGradeOrder ?? "ALL";
    setLocalTargetGrade(defaultGrade);
    setLocalCurricularProgram("ALL");
    setLocalPreviousSectionName("ALL");
    setIsOpen(false);
    onClearFilters();
  };

  const handleApply = () => {
    setIsOpen(false);
    onApplyFilters({
      targetGrade: localTargetGrade,
      curricularProgram: localCurricularProgram,
      previousSectionName: localPreviousSectionName,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter learners"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0 shadow-xl border-border bg-card">
        <div className="p-4 border-b">
          <h4 className="text-lg font-bold">Filter Learners</h4>
        </div>
        <div className="p-4 space-y-4 flex flex-col">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground uppercase">Incoming Grade</Label>
            <Select
              isFilter
              value={localTargetGrade}
              onValueChange={setLocalTargetGrade}
              disabled={Boolean(assignedTargetGradeOrder)}
            >
              <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                <SelectValue placeholder="All Incoming Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="leading-tight font-bold">All Incoming Grades</SelectItem>
                <SelectItem value="7" className="leading-tight font-bold">Grade 7</SelectItem>
                <SelectItem value="8" className="leading-tight font-bold">Grade 8</SelectItem>
                <SelectItem value="9" className="leading-tight font-bold">Grade 9</SelectItem>
                <SelectItem value="10" className="leading-tight font-bold">Grade 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground uppercase">Program Type</Label>
            <Select
              isFilter
              value={localCurricularProgram}
              onValueChange={setLocalCurricularProgram}
            >
              <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="leading-tight font-bold">All Programs</SelectItem>
                <SelectItem value="REGULAR" className="leading-tight font-bold">Basic Education Curriculum</SelectItem>
                <SelectItem value="SCIENCE_TECHNOLOGY_AND_ENGINEERING" className="leading-tight font-bold">SCIENCE, TECHNOLOGY, AND ENGINEERING</SelectItem>
                <SelectItem value="SPECIAL_PROGRAM_IN_THE_ARTS" className="leading-tight font-bold">Special Program in the Arts</SelectItem>
                <SelectItem value="SPECIAL_PROGRAM_IN_SPORTS" className="leading-tight font-bold">Special Program in Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground uppercase">Previous Section</Label>
            <Select
              isFilter
              value={localPreviousSectionName}
              onValueChange={setLocalPreviousSectionName}
            >
              <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                <SelectValue placeholder="All Previous Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="leading-tight font-bold">All Previous Sections</SelectItem>
                {previousSections
                  .filter((sec) => typeof sec === "string" && sec.trim() !== "")
                  .map((sec) => (
                    <SelectItem key={sec} value={sec} className="leading-tight font-bold">
                      {sec}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-3 border-t bg-gray-50 flex items-center justify-end gap-2 rounded-b-md">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="font-bold text-gray-600 hover:text-gray-900"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="font-bold bg-primary hover:bg-primary/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
