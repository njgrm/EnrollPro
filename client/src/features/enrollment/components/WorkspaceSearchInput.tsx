import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
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

export interface WorkspaceSearchInputProps {
  onSearchChange: (debouncedQuery: string) => void;
  filterProgram: string;
  onFilterProgramChange: (program: string) => void;
  placeholder?: string;
}

export const WorkspaceSearchInput = React.memo(function WorkspaceSearchInput({
  onSearchChange,
  filterProgram,
  onFilterProgramChange,
  placeholder = "Search LRN, first name, last name...",
}: WorkspaceSearchInputProps) {
  const [localValue, setLocalValue] = useState("");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [localFilterProgram, setLocalFilterProgram] = useState(filterProgram);
  const [, startTransition] = useTransition();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount = filterProgram !== "all" ? 1 : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setLocalValue(nextValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        onSearchChange(nextValue.trim());
      });
      debounceTimerRef.current = null;
    }, 300);
  };

  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setLocalValue("");
    startTransition(() => {
      onSearchChange("");
    });
  }, [onSearchChange]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex gap-2 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-20 bg-background border-border shadow-xs transition-shadow focus-visible:ring-primary uppercase font-bold"
          value={localValue}
          onChange={handleInputChange}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {localValue.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <Popover
            open={isFilterPopoverOpen}
            onOpenChange={(open) => {
              setIsFilterPopoverOpen(open);
              if (open) {
                setLocalFilterProgram(filterProgram);
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex items-center justify-center h-10 w-10 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                title="Filter options"
                aria-label="Filter options"
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-destructive rounded-full shadow-xs">
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
                  <Label className="text-sm text-muted-foreground uppercase">Program Type</Label>
                  <Select
                    isFilter
                    value={localFilterProgram}
                    onValueChange={setLocalFilterProgram}
                  >
                    <SelectTrigger className="h-10 w-full leading-tight font-bold transition-colors">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="leading-tight font-bold">All Programs</SelectItem>
                      <SelectItem value="REGULAR" className="leading-tight font-bold">Basic Education Curriculum</SelectItem>
                      <SelectItem value="SCIENCE_TECHNOLOGY_AND_ENGINEERING" className="leading-tight font-bold">SCIENCE, TECHNOLOGY, AND ENGINEERING</SelectItem>
                      <SelectItem value="SPECIAL_PROGRAM_IN_THE_ARTS" className="leading-tight font-bold">Special Program in the Arts</SelectItem>
                      <SelectItem value="SPECIAL_PROGRAM_IN_SPORTS" className="leading-tight font-bold">Special Program in Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 border-t bg-muted/40 flex items-center justify-end gap-2 rounded-b-md">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLocalFilterProgram("all");
                    startTransition(() => {
                      onFilterProgramChange("all");
                    });
                    setIsFilterPopoverOpen(false);
                  }}
                  className="font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => {
                    startTransition(() => {
                      onFilterProgramChange(localFilterProgram);
                    });
                    setIsFilterPopoverOpen(false);
                  }}
                  className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
});
