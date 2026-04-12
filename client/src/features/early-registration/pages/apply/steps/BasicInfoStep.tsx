import { useFormContext } from "react-hook-form";
import type { EarlyRegFormData } from "../types";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const GRADE_OPTIONS = [
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
];

const LEARNER_TYPES = [
  { value: "NEW_ENROLLEE", label: "New Enrollee" },
  { value: "TRANSFEREE", label: "Transferee" },
  { value: "RETURNING", label: "Returning (Balik-Aral)" },
  { value: "CONTINUING", label: "Continuing" },
];

export default function BasicInfoStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EarlyRegFormData>();

  const gradeLevel = watch("gradeLevel");
  const lrnRequired = parseInt(gradeLevel, 10) >= 8;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Grade level, school year, and learner reference number
        </p>
      </div>

      {/* School Year — Read-only from active SY */}
      <div className="space-y-2">
        <Label htmlFor="schoolYear">
          School Year <span className="text-destructive">*</span>
        </Label>
        <Input
          id="schoolYear"
          {...register("schoolYear")}
          readOnly
          className="bg-muted cursor-not-allowed"
        />
      </div>

      {/* Grade Level */}
      <div className="space-y-2">
        <Label>
          Grade Level <span className="text-destructive">*</span>
        </Label>
        <Select
          value={gradeLevel}
          onValueChange={(v) =>
            setValue("gradeLevel", v as EarlyRegFormData["gradeLevel"], {
              shouldValidate: true,
            })
          }>
          <SelectTrigger>
            <SelectValue placeholder="Select grade level" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.gradeLevel && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.gradeLevel.message}
          </p>
        )}
      </div>

      {/* LRN */}
      <div className="space-y-2">
        <Label htmlFor="lrn">
          Learner Reference Number (LRN)
          {lrnRequired && <span className="text-destructive"> *</span>}
        </Label>
        <Input
          id="lrn"
          {...register("lrn")}
          placeholder="12-digit LRN"
          maxLength={12}
          inputMode="numeric"
        />
        {lrnRequired && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            LRN is required for Grade 8-10 learners
          </p>
        )}
        {errors.lrn && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.lrn.message}
          </p>
        )}
      </div>

      {/* Learner Type */}
      <div className="space-y-3">
        <Label>
          Learner Type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={watch("learnerType")}
          onValueChange={(v) =>
            setValue("learnerType", v as EarlyRegFormData["learnerType"], {
              shouldValidate: true,
            })
          }
          className="grid grid-cols-2 gap-3">
          {LEARNER_TYPES.map((lt) => (
            <Label
              key={lt.value}
              htmlFor={`lt-${lt.value}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                watch("learnerType") === lt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}>
              <RadioGroupItem value={lt.value} id={`lt-${lt.value}`} />
              <span className="text-sm font-medium">{lt.label}</span>
            </Label>
          ))}
        </RadioGroup>
        {errors.learnerType && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.learnerType.message}
          </p>
        )}
      </div>
    </div>
  );
}
