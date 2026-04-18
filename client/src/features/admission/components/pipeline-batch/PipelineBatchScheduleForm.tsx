import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { TimePicker } from "@/shared/ui/time-picker";
import { Textarea } from "@/shared/ui/textarea";
import type { ScheduleFormRenderOptions, ScheduleFormState } from "./types";

interface PipelineBatchScheduleFormProps {
  form: ScheduleFormState;
  onChange: (patch: Partial<ScheduleFormState>) => void;
  modeLabel: "Exam" | "Interview";
  isBatchProcessing: boolean;
  isReadOnly?: boolean;
  options?: ScheduleFormRenderOptions;
}

export default function PipelineBatchScheduleForm({
  form,
  onChange,
  modeLabel,
  isBatchProcessing,
  isReadOnly = false,
  options,
}: PipelineBatchScheduleFormProps) {
  return (
    <div className="space-y-4">
      {options && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground">
              Loaded from scp_program_steps
            </p>
            {options?.onReloadDefaults && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => options.onReloadDefaults?.()}
                disabled={Boolean(options.defaultsLoading) || isBatchProcessing}
                className="h-7 text-[11px] font-bold">
                {options.defaultsLoading ? (
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5 mr-1" />
                )}
                Refresh Defaults
              </Button>
            )}
          </div>

          {options?.stepTemplate ? (
            <div className="space-y-1">
              <p className="text-xs font-bold">
                Step: {options.stepTemplate.label || options.stepTemplate.kind}
              </p>
              {typeof options.selectedCount === "number" && (
                <p className="text-xs font-bold text-foreground">
                  Selected applicants: {options.selectedCount}
                </p>
              )}
              {options.stepTemplate.cutoffScore != null && (
                <p className="text-xs font-bold text-foreground">
                  Cut-off Score: {options.stepTemplate.cutoffScore}
                </p>
              )}
              {isReadOnly && (
                <p className="text-[11px] font-bold text-foreground">
                  To change {modeLabel} Date, {modeLabel} Time, Venue, and
                  Notes, go to Settings -&gt; Curriculum Tab.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-bold text-foreground">
              No SCP step defaults were found for this applicant type and{" "}
              {modeLabel.toLowerCase()} step.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">
            {modeLabel} Date
          </Label>
          <Input
            type="date"
            value={form.scheduledDate}
            onChange={(event) =>
              onChange({ scheduledDate: event.target.value })
            }
            disabled={isBatchProcessing || isReadOnly}
            className="font-bold"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide">
            {modeLabel} Time
          </Label>
          <TimePicker
            value={form.scheduledTime}
            onChange={(scheduledTime) => onChange({ scheduledTime })}
            disabled={isBatchProcessing || isReadOnly}
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide">
          Venue
        </Label>
        <Input
          value={form.venue}
          onChange={(event) => onChange({ venue: event.target.value })}
          placeholder={`Enter ${modeLabel.toLowerCase()} venue`}
          disabled={isBatchProcessing || isReadOnly}
          className="font-bold"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide">
          Notes
        </Label>
        <Textarea
          value={form.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Optional schedule notes"
          disabled={isBatchProcessing || isReadOnly}
          className="min-h-[92px] text-sm font-bold"
        />
      </div>

      {isReadOnly && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="text-xs font-bold text-amber-900">
            This schedule uses values from scp_program_steps. To change{" "}
            {modeLabel} Date, {modeLabel} Time, Venue, and Notes, update
            Settings -&gt; Curriculum Tab.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <p className="text-xs font-bold text-foreground">
          Email notifications are required for scheduling actions and will be
          queued automatically.
        </p>
      </div>
    </div>
  );
}
