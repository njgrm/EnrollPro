import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { Application } from "./types";

interface PipelineBatchScpAssessmentInterviewGridProps {
  selectedApplications: Application[];
  isBatchProcessing: boolean;
  mode: "RECORD_ASSESSMENT" | "FINALIZE_PHASE_ONE";
  assessmentCutoffScore: number | null;
  getScoreValue: (applicantId: number, applicant: Application) => string;
  onScoreChange: (applicantId: number, value: string) => void;
  isScoreInvalid: (value: string) => boolean;
  getInterviewDecision: (applicantId: number) => "PASS" | "REJECT" | null;
  onInterviewDecisionChange: (
    applicantId: number,
    decision: "PASS" | "REJECT",
  ) => void;
}

export default function PipelineBatchScpAssessmentInterviewGrid({
  selectedApplications,
  isBatchProcessing,
  mode,
  assessmentCutoffScore,
  getScoreValue,
  onScoreChange,
  isScoreInvalid,
  getInterviewDecision,
  onInterviewDecisionChange,
}: PipelineBatchScpAssessmentInterviewGridProps) {
  const isAssessmentMode = mode === "RECORD_ASSESSMENT";

  return (
    <div className="space-y-3 min-h-0 flex flex-col">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <p className="text-xs font-bold text-foreground">
          {isAssessmentMode
            ? "Record assessment scores for each learner. Remarks will update live based on the configured SCP cut-off score."
            : "Finalize interview outcomes per learner. Assessment score is shown as reference from encoded assessment results."}
        </p>
      </div>

      <div className="rounded-lg border overflow-auto min-h-0 relative">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="sticky left-0 z-[90] bg-muted/40 min-w-[240px] shadow-[2px_0_0_0_hsl(var(--border))] text-xs font-bold">
                Name
              </TableHead>
              <TableHead className="text-center min-w-[220px] text-xs font-bold">
                Record Assessment Score
              </TableHead>
              {isAssessmentMode ? (
                <TableHead className="text-center min-w-[200px] text-xs font-bold">
                  Remarks
                </TableHead>
              ) : (
                <TableHead className="text-center min-w-[270px] text-xs font-bold">
                  Did the learner pass the interview?
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {selectedApplications.map((applicant) => {
              const scoreValue = getScoreValue(applicant.id, applicant);
              const decision = getInterviewDecision(applicant.id);
              const yesChecked = decision === "PASS";
              const noChecked = decision === "REJECT";
              const normalizedScore = scoreValue.trim();
              const numericScore = Number(normalizedScore);
              const hasNumericScore =
                normalizedScore.length > 0 && Number.isFinite(numericScore);
              const scoreInvalid = isAssessmentMode
                ? normalizedScore.length > 0 && isScoreInvalid(scoreValue)
                : false;

              const hasConfiguredCutoff =
                assessmentCutoffScore != null &&
                Number.isFinite(assessmentCutoffScore);
              const isPassed =
                isAssessmentMode &&
                hasNumericScore &&
                hasConfiguredCutoff &&
                !scoreInvalid &&
                numericScore >= Number(assessmentCutoffScore);
              const isFailed =
                isAssessmentMode &&
                hasNumericScore &&
                hasConfiguredCutoff &&
                !scoreInvalid &&
                numericScore < Number(assessmentCutoffScore);

              let scoreInputToneClass = "";
              if (scoreInvalid) {
                scoreInputToneClass =
                  "border-destructive text-destructive focus-visible:ring-destructive";
              } else if (isPassed) {
                scoreInputToneClass =
                  "border-emerald-500 text-emerald-700 focus-visible:ring-emerald-500";
              } else if (isFailed) {
                scoreInputToneClass =
                  "border-destructive text-destructive focus-visible:ring-destructive";
              }

              let assessmentRemark = "---";
              let assessmentRemarkClass = "text-foreground";
              if (normalizedScore.length > 0) {
                if (scoreInvalid) {
                  assessmentRemark = "Invalid score";
                  assessmentRemarkClass = "text-destructive";
                } else if (!hasConfiguredCutoff) {
                  assessmentRemark = "Cut-off not set";
                } else if (isPassed) {
                  assessmentRemark = "PASSED";
                  assessmentRemarkClass = "text-emerald-700";
                } else if (isFailed) {
                  assessmentRemark = "FAILED";
                  assessmentRemarkClass = "text-destructive";
                }
              }

              return (
                <TableRow key={applicant.id}>
                  <TableCell className="sticky left-0 bg-background z-[85] min-w-[240px]">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase">
                        {applicant.lastName}, {applicant.firstName}
                      </p>
                      <p className="text-[11px] font-bold text-foreground">
                        #{applicant.trackingNumber}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={scoreValue}
                      onChange={(event) =>
                        onScoreChange(applicant.id, event.target.value)
                      }
                      readOnly={!isAssessmentMode}
                      disabled={isBatchProcessing || !isAssessmentMode}
                      placeholder={isAssessmentMode ? "0 - 100" : "No score"}
                      className={`h-8 text-center text-sm font-bold ${scoreInputToneClass}`}
                    />
                    {isAssessmentMode && (
                      <p className="mt-1 text-center text-[11px] font-bold text-foreground">
                        Cut-off:{" "}
                        {hasConfiguredCutoff
                          ? assessmentCutoffScore
                          : "Not set"}
                      </p>
                    )}
                  </TableCell>

                  {isAssessmentMode ? (
                    <TableCell className="text-center">
                      <span
                        className={`text-xs font-bold ${assessmentRemarkClass}`}>
                        {assessmentRemark}
                      </span>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <div className="flex items-center justify-center gap-5">
                        <label className="inline-flex items-center gap-2 text-xs font-bold">
                          <Checkbox
                            checked={yesChecked}
                            onCheckedChange={(checked) => {
                              if (!isAssessmentMode && checked) {
                                onInterviewDecisionChange(applicant.id, "PASS");
                              }
                            }}
                            disabled={isBatchProcessing || isAssessmentMode}
                          />
                          Yes
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs font-bold">
                          <Checkbox
                            checked={noChecked}
                            onCheckedChange={(checked) => {
                              if (!isAssessmentMode && checked) {
                                onInterviewDecisionChange(
                                  applicant.id,
                                  "REJECT",
                                );
                              }
                            }}
                            disabled={isBatchProcessing || isAssessmentMode}
                          />
                          No
                        </label>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
