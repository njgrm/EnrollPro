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
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";
import { Button } from "@/shared/ui/button";

export interface VerificationFilterPopoverProps {
  intakeCategoryFilter: string;
  programFilter: string;
  trackingNumberFilter: string;
  showOnline: boolean;
  showWalkIn: boolean;
  isTransfereeOnlyCoordinator: boolean;
  activeProgramOptions: { value: string; label: string }[];
  activeFilterCount: number;
  onApplyFilters: (filters: {
    intakeCategoryFilter: string;
    programFilter: string;
    trackingNumberFilter: string;
    showOnline: boolean;
    showWalkIn: boolean;
  }) => void;
  onClearFilters: () => void;
}

export const VerificationFilterPopover = React.memo(function VerificationFilterPopover({
  intakeCategoryFilter,
  programFilter,
  trackingNumberFilter,
  showOnline,
  showWalkIn,
  isTransfereeOnlyCoordinator,
  activeProgramOptions,
  activeFilterCount,
  onApplyFilters,
  onClearFilters,
}: VerificationFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localIntakeCategoryFilter, setLocalIntakeCategoryFilter] = useState<string>(intakeCategoryFilter);
  const [localProgramFilter, setLocalProgramFilter] = useState<string>(programFilter);
  const [localTrackingNumberFilter, setLocalTrackingNumberFilter] = useState(trackingNumberFilter);
  const [localShowOnline, setLocalShowOnline] = useState(showOnline);
  const [localShowWalkIn, setLocalShowWalkIn] = useState(showWalkIn);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalIntakeCategoryFilter(intakeCategoryFilter);
      setLocalProgramFilter(programFilter);
      setLocalTrackingNumberFilter(trackingNumberFilter);
      setLocalShowOnline(showOnline);
      setLocalShowWalkIn(showWalkIn);
    }
  };

  const handleClear = () => {
    const defaultIntake = isTransfereeOnlyCoordinator ? "TRANSFEREE" : "ALL";
    setLocalIntakeCategoryFilter(defaultIntake);
    setLocalProgramFilter("ALL");
    setLocalTrackingNumberFilter("");
    setLocalShowOnline(true);
    setLocalShowWalkIn(true);
    setIsOpen(false);
    onClearFilters();
  };

  const handleApply = () => {
    setIsOpen(false);
    onApplyFilters({
      intakeCategoryFilter: localIntakeCategoryFilter,
      programFilter: localProgramFilter,
      trackingNumberFilter: localTrackingNumberFilter,
      showOnline: localShowOnline,
      showWalkIn: localShowWalkIn,
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
            <Label className="text-sm text-muted-foreground uppercase">Enrollment Status</Label>
            <Select
              isFilter
              value={localIntakeCategoryFilter}
              onValueChange={setLocalIntakeCategoryFilter}
              disabled={isTransfereeOnlyCoordinator}
            >
              <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                <SelectValue placeholder="All Enrollment Statuses" />
              </SelectTrigger>
              <SelectContent>
                {!isTransfereeOnlyCoordinator && (
                  <SelectItem value="ALL" className="leading-tight font-bold">All Enrollment Statuses</SelectItem>
                )}
                {!isTransfereeOnlyCoordinator && (
                  <SelectItem value="NEW_ENROLLEE" className="leading-tight font-bold">New Entrants</SelectItem>
                )}
                <SelectItem value="TRANSFEREE" className="leading-tight font-bold">Transferees</SelectItem>
                {!isTransfereeOnlyCoordinator && (
                  <SelectItem value="RETURNING" className="leading-tight font-bold">Returnee (Balik-Aral)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground uppercase">Program Type</Label>
            <Select
              isFilter
              value={localProgramFilter}
              onValueChange={setLocalProgramFilter}
            >
              <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="leading-tight font-bold">All Programs</SelectItem>
                {activeProgramOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="leading-tight font-bold">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground uppercase">Application Tracking Number</Label>
            <Input
              placeholder="e.g. BEC20270000001"
              value={localTrackingNumberFilter}
              onChange={(e) => setLocalTrackingNumberFilter(e.target.value)}
              className="h-10 font-bold uppercase"
            />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm text-muted-foreground uppercase">Admission Channel</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-online"
                  checked={localShowOnline}
                  onCheckedChange={(c) => setLocalShowOnline(c as boolean)}
                />
                <label htmlFor="filter-online" className="font-bold cursor-pointer select-none">Show Online</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-walkin"
                  checked={localShowWalkIn}
                  onCheckedChange={(c) => setLocalShowWalkIn(c as boolean)}
                />
                <label htmlFor="filter-walkin" className="font-bold cursor-pointer select-none">Show Walk-in</label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t bg-gray-50 flex items-center justify-end gap-2 rounded-b-md">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="font-bold uppercase text-gray-600 hover:text-gray-900"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="font-bold uppercase bg-primary hover:bg-primary/90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
