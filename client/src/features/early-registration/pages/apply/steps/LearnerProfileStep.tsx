import { useFormContext, Controller } from "react-hook-form";
import type { EarlyRegFormData } from "../types";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Switch } from "@/shared/ui/switch";
import { DatePicker } from "@/shared/ui/date-picker";
import { AlertCircle } from "lucide-react";
import { differenceInYears } from "date-fns";
import { cn } from "@/shared/lib/utils";

const DISABILITY_TYPES = [
  { value: "VISUAL", label: "Visual Impairment" },
  { value: "HEARING", label: "Hearing Impairment" },
  { value: "INTELLECTUAL", label: "Intellectual Disability" },
  { value: "LEARNING", label: "Learning Disability" },
  { value: "PSYCHOSOCIAL", label: "Psychosocial Disability" },
  { value: "ORTHOPEDIC", label: "Orthopedic/Physical Disability" },
  { value: "SPEECH", label: "Speech/Language Disorder" },
  { value: "AUTISM", label: "Autism Spectrum Disorder" },
  { value: "CHRONIC_ILLNESS", label: "Chronic Illness" },
  { value: "MULTIPLE", label: "Multiple Disabilities" },
];

export default function LearnerProfileStep() {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<EarlyRegFormData>();

  const birthdate = watch("birthdate");
  const isIp = watch("isIpCommunity");
  const isPwd = watch("isLearnerWithDisability");
  const selectedDisabilities = watch("disabilityTypes") || [];

  const age = birthdate
    ? differenceInYears(new Date(), new Date(birthdate))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Learner Profile</h2>
        <p className="text-sm text-muted-foreground">
          Personal details as they appear on official documents
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name (Apelyido) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="DELA CRUZ"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name (Pangalan) <span className="text-destructive">*</span>
          </Label>
          <Input id="firstName" {...register("firstName")} placeholder="JUAN" />
          {errors.firstName && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name (Gitnang Pangalan)</Label>
          <Input
            id="middleName"
            {...register("middleName")}
            placeholder="SANTOS"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="extensionName">Extension Name (e.g. Jr., III)</Label>
          <Input
            id="extensionName"
            {...register("extensionName")}
            placeholder="JR."
          />
        </div>
      </div>

      {/* Birthdate + Age + Sex */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="birthdate"
            render={({ field }) => (
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                setDate={(date?: Date) => {
                  field.onChange(date ? date.toISOString() : "");
                }}
              />
            )}
          />
          {errors.birthdate && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.birthdate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Age</Label>
          <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
            {age !== null && age >= 0 ? `${age} years old` : "—"}
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Sex <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={watch("sex")}
            onValueChange={(v) =>
              setValue("sex", v as EarlyRegFormData["sex"], {
                shouldValidate: true,
              })
            }
            className="flex gap-4 pt-1">
            {(["MALE", "FEMALE"] as const).map((s) => (
              <Label
                key={s}
                htmlFor={`sex-${s}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors",
                  watch("sex") === s
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}>
                <RadioGroupItem value={s} id={`sex-${s}`} />
                <span className="text-sm">
                  {s === "MALE" ? "Male" : "Female"}
                </span>
              </Label>
            ))}
          </RadioGroup>
          {errors.sex && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.sex.message}
            </p>
          )}
        </div>
      </div>

      {/* Religion */}
      <div className="space-y-2">
        <Label htmlFor="religion">Religion</Label>
        <Input
          id="religion"
          {...register("religion")}
          placeholder="e.g. Roman Catholic"
        />
      </div>

      {/* IP Community Toggle */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">
              Belonging to any Indigenous Peoples (IP) Community/Group?
            </Label>
            <p className="text-xs text-muted-foreground">
              As defined under RA 8371 (IPRA)
            </p>
          </div>
          <Switch
            checked={isIp}
            onCheckedChange={(v) => {
              setValue("isIpCommunity", v);
              if (!v) setValue("ipGroupName", "");
            }}
          />
        </div>
        {isIp && (
          <div className="space-y-2 pt-1">
            <Label htmlFor="ipGroupName">
              Specify IP Group/Ethnicity{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ipGroupName"
              {...register("ipGroupName")}
              placeholder="e.g. Mangyan, T'boli, Igorot"
            />
            {errors.ipGroupName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.ipGroupName.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* PWD Toggle */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">
              Is the learner a Person with Disability (PWD)?
            </Label>
            <p className="text-xs text-muted-foreground">
              As defined under RA 7277 (Magna Carta for Persons with Disability)
            </p>
          </div>
          <Switch
            checked={isPwd}
            onCheckedChange={(v) => {
              setValue("isLearnerWithDisability", v);
              if (!v) setValue("disabilityTypes", []);
            }}
          />
        </div>
        {isPwd && (
          <div className="space-y-2 pt-1">
            <Label>
              Specify Disability Type(s){" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DISABILITY_TYPES.map((dt) => {
                const isSelected = selectedDisabilities.includes(
                  dt.value as (typeof selectedDisabilities)[number],
                );
                return (
                  <Label
                    key={dt.value}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors text-sm",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const current = [...(selectedDisabilities || [])];
                        if (isSelected) {
                          setValue(
                            "disabilityTypes",
                            current.filter((d) => d !== dt.value),
                          );
                        } else {
                          setValue("disabilityTypes", [
                            ...current,
                            dt.value as (typeof selectedDisabilities)[number],
                          ]);
                        }
                      }}
                      className="rounded border-border"
                    />
                    {dt.label}
                  </Label>
                );
              })}
            </div>
            {errors.disabilityTypes && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {(errors.disabilityTypes as { message?: string })?.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
