import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, BookOpen, Info } from "lucide-react";

import type { EnrollmentFormData } from "../types";
import {
  SPA_ART_FIELDS,
  SPS_SPORTS,
  SPFL_LANGUAGES,
  LEARNING_MODALITIES,
} from "../types";
import { cn, SCP_LABELS } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const LEARNER_TYPES = [
  { value: "NEW_ENROLLEE", label: "NEW ENROLLEE" },
  { value: "TRANSFEREE", label: "TRANSFEREE" },
  { value: "RETURNING", label: "RETURNING" },
] as const;

const GRADE_OPTIONS = [
  { value: "7", label: "GRADE 7" },
  { value: "8", label: "GRADE 8" },
  { value: "9", label: "GRADE 9" },
  { value: "10", label: "GRADE 10" },
] as const;

const SCP_PROGRAMS = [
  {
    id: "SCIENCE_TECHNOLOGY_AND_ENGINEERING",
    label: SCP_LABELS.SCIENCE_TECHNOLOGY_AND_ENGINEERING,
    desc: "Written entrance exam + interview.",
  },
  {
    id: "SPECIAL_PROGRAM_IN_THE_ARTS",
    label: SCP_LABELS.SPECIAL_PROGRAM_IN_THE_ARTS,
    desc: "Written exam + audition + interview.",
  },
  {
    id: "SPECIAL_PROGRAM_IN_SPORTS",
    label: SCP_LABELS.SPECIAL_PROGRAM_IN_SPORTS,
    desc: "Physical tryout and sports screening.",
  },
  {
    id: "SPECIAL_PROGRAM_IN_JOURNALISM",
    label: SCP_LABELS.SPECIAL_PROGRAM_IN_JOURNALISM,
    desc: "Written exam + interview.",
  },
  {
    id: "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE",
    label: SCP_LABELS.SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE,
    desc: "Language aptitude screening.",
  },
  {
    id: "SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION",
    label: SCP_LABELS.SPECIAL_PROGRAM_IN_TECHNICAL_VOCATIONAL_EDUCATION,
    desc: "Technical-vocational aptitude assessment.",
  },
] as const;

export default function Step5Enrollment() {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<EnrollmentFormData>();

  const learnerType = watch("learnerType");
  const gradeLevel = watch("gradeLevel");
  const isScpApplication = watch("isScpApplication");
  const scpType = watch("scpType");
  const hasNoLrn = watch("hasNoLrn");
  const artField = watch("artField");
  const sportsList = watch("sportsList");
  const foreignLanguage = watch("foreignLanguage");
  const learningModalities = watch("learningModalities");

  const selectedSportsList = sportsList ?? [];
  const selectedSportsCount = sportsList?.length ?? 0;
  const selectedLearningModalities = learningModalities ?? [];

  const isScpEligible = learnerType === "NEW_ENROLLEE" && gradeLevel === "7";
  const canDeclareNoLrn =
    learnerType === "TRANSFEREE" ||
    (learnerType === "NEW_ENROLLEE" && gradeLevel === "7");
  const visibleGradeOptions =
    learnerType === "NEW_ENROLLEE"
      ? GRADE_OPTIONS.filter((option) => option.value === "7")
      : GRADE_OPTIONS;

  useEffect(() => {
    if (learnerType === "NEW_ENROLLEE" && gradeLevel !== "7") {
      setValue("gradeLevel", "7", { shouldValidate: true });
    }
  }, [learnerType, gradeLevel, setValue]);

  useEffect(() => {
    if (!isScpEligible && (isScpApplication || scpType)) {
      setValue("isScpApplication", false, { shouldValidate: true });
      setValue("scpType", undefined, { shouldValidate: true });
      clearErrors("scpType");
    }
  }, [isScpEligible, isScpApplication, scpType, setValue, clearErrors]);

  useEffect(() => {
    if (
      !isScpApplication &&
      (scpType || artField || selectedSportsCount > 0 || foreignLanguage)
    ) {
      setValue("scpType", undefined, { shouldValidate: true });
      setValue("artField", undefined, { shouldValidate: true });
      setValue("sportsList", [], { shouldValidate: true });
      setValue("foreignLanguage", undefined, { shouldValidate: true });
      clearErrors(["scpType", "artField", "sportsList", "foreignLanguage"]);
    }
  }, [
    isScpApplication,
    scpType,
    artField,
    selectedSportsCount,
    foreignLanguage,
    setValue,
    clearErrors,
  ]);

  useEffect(() => {
    if (scpType !== "SPECIAL_PROGRAM_IN_THE_ARTS" && artField) {
      setValue("artField", undefined, { shouldValidate: true });
      clearErrors("artField");
    }

    if (scpType !== "SPECIAL_PROGRAM_IN_SPORTS" && selectedSportsCount > 0) {
      setValue("sportsList", [], { shouldValidate: true });
      clearErrors("sportsList");
    }

    if (scpType !== "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE" && foreignLanguage) {
      setValue("foreignLanguage", undefined, { shouldValidate: true });
      clearErrors("foreignLanguage");
    }
  }, [
    scpType,
    artField,
    selectedSportsCount,
    foreignLanguage,
    setValue,
    clearErrors,
  ]);

  useEffect(() => {
    if (!canDeclareNoLrn && hasNoLrn) {
      setValue("hasNoLrn", false, { shouldValidate: true, shouldDirty: true });
      clearErrors("hasNoLrn");
    }
  }, [canDeclareNoLrn, hasNoLrn, setValue, clearErrors]);

  const selectRegularTrack = () => {
    setValue("isScpApplication", false, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("scpType", undefined, { shouldValidate: true, shouldDirty: true });
    clearErrors("scpType");
  };

  const selectScpTrack = () => {
    if (!isScpEligible) return;
    setValue("isScpApplication", true, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Label className="text-sm font-bold uppercase tracking-widest text-primary">
          Learner Category <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEARNER_TYPES.map((typeOption) => (
            <button
              key={typeOption.value}
              type="button"
              onClick={() =>
                setValue("learnerType", typeOption.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "flex items-center justify-center p-3 rounded-xl border-2 transition-all text-center h-14 uppercase",
                learnerType === typeOption.value
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-white hover:bg-primary/5 text-muted-foreground hover:text-foreground",
              )}>
              <span className="font-bold text-sm leading-tight tracking-wide">
                {typeOption.label}
              </span>
            </button>
          ))}
        </div>
        {errors.learnerType?.message && (
          <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" /> {errors.learnerType.message}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <Label className="text-sm font-bold uppercase tracking-widest text-primary">
          Grade Level to Apply for <span className="text-destructive">*</span>
        </Label>
        <div
          className={cn(
            "grid gap-3",
            learnerType === "NEW_ENROLLEE"
              ? "grid-cols-1"
              : "grid-cols-2 sm:grid-cols-4",
          )}>
          {visibleGradeOptions.map((gradeOption) => (
            <button
              key={gradeOption.value}
              type="button"
              onClick={() =>
                setValue("gradeLevel", gradeOption.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all h-14 uppercase",
                gradeLevel === gradeOption.value
                  ? "border-primary bg-primary text-white shadow-sm ring-1 ring-primary"
                  : "border-border bg-white hover:border-primary/50 hover:bg-primary/5",
              )}>
              <span className="text-sm font-bold leading-tight">
                {gradeOption.label}
              </span>
            </button>
          ))}
        </div>
        {errors.gradeLevel?.message && (
          <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3" /> {errors.gradeLevel.message}
          </p>
        )}
      </div>

      <div className="space-y-8 pb-8">
        <div className="p-6 border bg-primary/5 border-primary/20 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <Label className="text-base font-bold text-primary">
              Learning Program <span className="text-destructive">*</span>
            </Label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              className={cn(
                "flex flex-col p-4 rounded-xl border-2 transition-all text-left",
                !isScpApplication
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white hover:bg-primary/5",
              )}
              onClick={selectRegularTrack}>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    !isScpApplication
                      ? "border-white"
                      : "border-muted-foreground",
                  )}>
                  {!isScpApplication && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-bold">Regular Section</span>
              </div>
              <p
                className={cn(
                  "text-xs pl-8",
                  !isScpApplication
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}>
                Standard Junior High curriculum.
              </p>
            </button>

            <button
              type="button"
              disabled={!isScpEligible}
              className={cn(
                "flex flex-col p-4 rounded-xl border-2 transition-all text-left",
                isScpApplication
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white",
                !isScpEligible &&
                  "opacity-60 cursor-not-allowed border-dashed border-muted-foreground/40",
                isScpEligible && !isScpApplication && "hover:bg-primary/5",
              )}
              onClick={selectScpTrack}>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isScpApplication
                      ? "border-white"
                      : "border-muted-foreground",
                  )}>
                  {isScpApplication && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="font-bold">
                  Special Curricular Program (SCP)
                </span>
              </div>
              <p
                className={cn(
                  "text-xs pl-8",
                  isScpApplication
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}>
                Select this if the learner will apply for an SCP track.
              </p>
            </button>
          </div>

          {!isScpEligible && (
            <p className="font-bold text-xs italic flex items-center gap-1 text-muted-foreground">
              <Info className="w-4 h-4" />
              SCP is available only for New Enrollees applying for Grade 7.
            </p>
          )}

          <AnimatePresence>
            {isScpApplication && isScpEligible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="pt-6 space-y-6">
                  <Label className="text-sm font-bold uppercase tracking-widest text-primary">
                    Select SCP Program{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {SCP_PROGRAMS.map((program) => (
                      <div key={program.id} className="space-y-0">
                        <button
                          type="button"
                          className={cn(
                            "w-full flex flex-col p-4 rounded-xl border-2 transition-all text-left",
                            scpType === program.id
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : "border-border bg-white text-foreground hover:bg-primary/5",
                          )}
                          onClick={() =>
                            setValue(
                              "scpType",
                              program.id as NonNullable<
                                EnrollmentFormData["scpType"]
                              >,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              },
                            )
                          }>
                          <div className="flex items-center gap-3 mb-1">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                scpType === program.id
                                  ? "border-white"
                                  : "border-muted-foreground",
                              )}>
                              {scpType === program.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="font-bold">{program.label}</span>
                          </div>
                          <p
                            className={cn(
                              "text-[0.6875rem] pl-8 italic",
                              scpType === program.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground",
                            )}>
                            {program.desc}
                          </p>
                        </button>

                        <AnimatePresence>
                          {scpType === program.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="pl-8 pt-4">
                                {program.id ===
                                  "SPECIAL_PROGRAM_IN_THE_ARTS" && (
                                  <div className="space-y-2">
                                    <Label className="text-[0.625rem] font-bold uppercase text-primary">
                                      Preferred Art Field *
                                    </Label>
                                    <Select
                                      onValueChange={(value) =>
                                        setValue("artField", value, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        })
                                      }
                                      value={artField}>
                                      <SelectTrigger className="h-10 bg-white border-2 font-bold">
                                        <SelectValue placeholder="Select Art Field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SPA_ART_FIELDS.map((field) => (
                                          <SelectItem key={field} value={field}>
                                            {field}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {program.id === "SPECIAL_PROGRAM_IN_SPORTS" && (
                                  <div className="space-y-2">
                                    <Label className="text-[0.625rem] font-bold uppercase text-primary">
                                      Primary Sport *
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {SPS_SPORTS.map((sport) => (
                                        <div
                                          key={sport}
                                          className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`sport-${sport}`}
                                            checked={selectedSportsList.includes(
                                              sport,
                                            )}
                                            onCheckedChange={(checked) => {
                                              const nextSports = checked
                                                ? [...selectedSportsList, sport]
                                                : selectedSportsList.filter(
                                                    (item) => item !== sport,
                                                  );
                                              setValue(
                                                "sportsList",
                                                nextSports,
                                                {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                },
                                              );
                                            }}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
                                          />
                                          <Label
                                            htmlFor={`sport-${sport}`}
                                            className="text-xs font-medium cursor-pointer">
                                            {sport}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {program.id ===
                                  "SPECIAL_PROGRAM_IN_FOREIGN_LANGUAGE" && (
                                  <div className="space-y-2">
                                    <Label className="text-[0.625rem] font-bold uppercase text-primary">
                                      Preferred Language *
                                    </Label>
                                    <Select
                                      onValueChange={(value) =>
                                        setValue("foreignLanguage", value, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        })
                                      }
                                      value={foreignLanguage}>
                                      <SelectTrigger className="h-10 bg-white border-2 font-bold">
                                        <SelectValue placeholder="Select Language" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SPFL_LANGUAGES.map((language) => (
                                          <SelectItem
                                            key={language}
                                            value={language}>
                                            {language}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  {errors.scpType?.message && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3 h-3" />{" "}
                      {errors.scpType.message}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-10 pt-6 border-t border-border/40">
        <div className="space-y-4">
          <Label className="text-sm font-bold uppercase tracking-widest text-primary">
            If the school implements other distance learning modalities aside
            from face-to-face instruction, which would the learner prefer? Check
            all that applies:
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {LEARNING_MODALITIES.map((modality) => (
              <div key={modality} className="flex items-center space-x-3">
                <Checkbox
                  id={`modality-${modality}`}
                  checked={selectedLearningModalities.includes(modality)}
                  onCheckedChange={(checked) => {
                    const nextModalities = checked
                      ? [...selectedLearningModalities, modality]
                      : selectedLearningModalities.filter(
                          (item) => item !== modality,
                        );

                    setValue("learningModalities", nextModalities, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  className="w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
                />
                <Label
                  htmlFor={`modality-${modality}`}
                  className="text-sm font-medium cursor-pointer">
                  {modality}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
