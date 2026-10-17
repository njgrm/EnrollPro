import { useState } from "react";
import { Info, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui/dialog";
import { LabelValuePair } from "@/features/learner/components/LabelValuePair";
import { SCP_LABELS, cn, getGradeLevelBadgeStyles } from "@/shared/lib/utils";
import type { LearnerDashboardResponse } from "@/features/learner/types";

export interface ProfileHeaderProps {
  data: LearnerDashboardResponse;
}

export function ProfileHeader({ data }: ProfileHeaderProps) {
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);

  const fullName = [
    data.identity.firstName,
    data.identity.middleName,
    data.identity.lastName,
    data.identity.extensionName,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = `${data.identity.firstName?.charAt(0) || ""}${
    data.identity.lastName?.charAt(0) || ""
  }`.toUpperCase() || "EP";

  const gradeSection = `${data.enrollment.gradeLevel || "Not Enrolled"}${
    data.enrollment.section ? ` - ${data.enrollment.section}` : ""
  }`;

  const curriculum = data.enrollment.curriculumProgram
    ? SCP_LABELS[data.enrollment.curriculumProgram] || data.enrollment.curriculumProgram
    : "Basic Education Curriculum";

  const adviserAssigned = Boolean(
    data.enrollment.advisingTeacher &&
      data.enrollment.advisingTeacher.toLowerCase() !== "to be assigned",
  );

  // Clean word formatting: strip underscores and normalize spacing
  const formattedEnrollmentStatus = (data.enrollment.status || "Enrolled")
    .replace(/_/g, " ")
    .trim();

  const formattedAcademicStatus = (data.enrollment.academicStatus || "Regular")
    .replace(/_/g, " ")
    .trim();

  return (
    <Card className="border border-border bg-card shadow-xs">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Horizontal flex layout: Avatar on the left, Name and LRN on the right */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 overflow-hidden border-2 border-primary/20 shadow-xs">
            {data.sf1.studentPhoto ? (
              <img
                src={data.sf1.studentPhoto}
                alt="Learner Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="uppercase tracking-tighter">{initials}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-primary uppercase tracking-tight truncate leading-tight">
              {fullName}
            </h2>
            <span className="text-xs sm:text-sm font-bold mt-0.5">
              LRN: {data.identity.lrn}
            </span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-xs font-bold uppercase", getGradeLevelBadgeStyles(data.enrollment.gradeLevel))}
              >
                {gradeSection}
              </Badge>
              <span className="text-sm hidden sm:inline">
                • S.Y. {data.activeSchoolYear}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Opens the Advisory Details modal */}
        <div className="flex items-center self-end sm:self-center shrink-0">
          <Dialog open={isAdvisoryModalOpen} onOpenChange={setIsAdvisoryModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-xs sm:text-sm gap-2 h-9"
              >
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Advisory Details</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-full max-w-lg sm:max-w-xl p-6 overflow-y-auto max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl"
              aria-describedby="advisory-modal-description"
            >
              <div className="space-y-5">
                <DialogHeader className="text-left pb-4 border-b border-border space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary shrink-0" />
                    <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                      Advisory & Program Details
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
                    {data.sf1.studentPhoto ? (
                      <img
                        src={data.sf1.studentPhoto}
                        alt="Learner Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="uppercase">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm sm:text-base text-primary uppercase truncate">
                      {fullName}
                    </p>
                    <p className="text-xs font-bold">LRN: {data.identity.lrn}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Official Class Adviser
                    </span>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-foreground uppercase">
                        {data.enrollment.advisingTeacher || "To Be Assigned"}
                      </span>
                      <Badge
                        variant={adviserAssigned ? "success" : "warning"}
                        className="text-[11px] uppercase font-bold"
                      >
                        {adviserAssigned ? "Assigned" : "To Be Assigned"}
                      </Badge>
                    </div>
                  </div>

                  <LabelValuePair
                    label="Curriculum Program"
                    value={curriculum}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LabelValuePair
                      label="Enrollment Status"
                      value={formattedEnrollmentStatus}
                    />
                    <LabelValuePair
                      label="Academic Status"
                      value={formattedAcademicStatus}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LabelValuePair
                      label="Grade Level"
                      value={data.enrollment.gradeLevel || "Not Enrolled"}
                    />
                    <LabelValuePair
                      label="Section"
                      value={data.enrollment.section || "Unsectioned"}
                    />
                  </div>

                  <LabelValuePair
                    label="Active School Year"
                    value={`S.Y. ${data.activeSchoolYear}`}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto font-bold"
                  onClick={() => setIsAdvisoryModalOpen(false)}
                >
                  Close Details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
