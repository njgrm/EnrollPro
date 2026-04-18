import type {
  TrackingCurrentStep,
  TrackingProgramType,
  TrackingStatus,
} from "@enrollpro/shared";

const NORMALIZED_STATUSES = new Set<TrackingStatus>([
  "SUBMITTED",
  "IN_REVIEW",
  "ASSESSMENT_IN_PROGRESS",
  "QUALIFIED_FOR_ENROLLMENT",
  "ENROLLED",
  "NOT_QUALIFIED",
  "REJECTED",
  "WITHDRAWN",
]);

const RAW_TO_TRACKING_STATUS: Record<string, TrackingStatus> = {
  SUBMITTED: "SUBMITTED",
  VERIFIED: "IN_REVIEW",
  UNDER_REVIEW: "IN_REVIEW",
  FOR_REVISION: "IN_REVIEW",
  ELIGIBLE: "IN_REVIEW",
  EXAM_SCHEDULED: "ASSESSMENT_IN_PROGRESS",
  ASSESSMENT_TAKEN: "ASSESSMENT_IN_PROGRESS",
  INTERVIEW_SCHEDULED: "ASSESSMENT_IN_PROGRESS",
  PASSED: "QUALIFIED_FOR_ENROLLMENT",
  READY_FOR_ENROLLMENT: "QUALIFIED_FOR_ENROLLMENT",
  TEMPORARILY_ENROLLED: "QUALIFIED_FOR_ENROLLMENT",
  FAILED_ASSESSMENT: "NOT_QUALIFIED",
  ENROLLED: "ENROLLED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

export function deriveProgramTypeFromApplicantType(
  applicantType?: string | null,
): TrackingProgramType {
  return applicantType && applicantType !== "REGULAR" ? "SCP" : "REGULAR";
}

export function normalizeTrackingStatus(
  status?: string | null,
): TrackingStatus {
  const normalized = String(status ?? "SUBMITTED")
    .trim()
    .toUpperCase();

  if (NORMALIZED_STATUSES.has(normalized as TrackingStatus)) {
    return normalized as TrackingStatus;
  }

  return RAW_TO_TRACKING_STATUS[normalized] ?? "SUBMITTED";
}

export function resolveCurrentStep(
  status: TrackingStatus,
  programType: TrackingProgramType,
): TrackingCurrentStep {
  switch (status) {
    case "SUBMITTED":
      return "APPLICATION_SUBMITTED";
    case "IN_REVIEW":
      return "REGISTRAR_REVIEW";
    case "ASSESSMENT_IN_PROGRESS":
      return programType === "SCP" ? "ASSESSMENT_PHASE" : "REGISTRAR_REVIEW";
    case "QUALIFIED_FOR_ENROLLMENT":
      return "ENROLLMENT_QUALIFICATION";
    case "ENROLLED":
      return "ENROLLED";
    case "NOT_QUALIFIED":
      return programType === "SCP"
        ? "ASSESSMENT_PHASE"
        : "ENROLLMENT_QUALIFICATION";
    case "REJECTED":
    case "WITHDRAWN":
      return "REGISTRAR_REVIEW";
    default:
      return "APPLICATION_SUBMITTED";
  }
}
