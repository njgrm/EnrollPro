import type { Teacher, TeacherFormState, TeacherSyncFilter } from "./types";

export const MAX_TEACHER_PHOTO_BYTES = 5 * 1024 * 1024;

export const DEPED_LEARNING_AREA_OPTIONS = [
  { value: "ENGLISH", label: "English" },
  { value: "FILIPINO", label: "Filipino" },
  { value: "MATHEMATICS", label: "Mathematics" },
  { value: "SCIENCE", label: "Science" },
  { value: "ARALING PANLIPUNAN", label: "Araling Panlipunan" },
  { value: "ESP", label: "Edukasyon sa Pagpapakatao (ESP)" },
  { value: "VALUES EDUCATION", label: "Values Education" },
  { value: "MAPEH", label: "MAPEH" },
  { value: "TLE", label: "Technology and Livelihood Education (TLE)" },
  { value: "ICT", label: "Information and Communications Technology (ICT)" },
  { value: "FOREIGN LANGUAGE", label: "Foreign Language" },
  { value: "JOURNALISM", label: "Journalism" },
  { value: "ARTS", label: "Arts" },
  { value: "SPORTS", label: "Sports" },
] as const;

export function createEmptyTeacherForm(): TeacherFormState {
  return {
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    employeeId: "",
    contactNumber: "",
    specialization: "",
    subjectsText: "",
    photo: null,
  };
}

export function parseSubjectsInput(subjectsText: string): string[] {
  return Array.from(
    new Set(
      subjectsText
        .split(",")
        .map((subject) => subject.trim().toUpperCase())
        .filter((subject) => subject.length > 0),
    ),
  );
}

export function normalizeOptionalInput(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getImageUrl(photo: string | null): string | null {
  if (!photo) {
    return null;
  }
  if (photo.startsWith("data:")) {
    return photo;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
    /\/api$/,
    "",
  );
  return `${baseUrl}${photo}`;
}

export function convertImageToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Image conversion failed"));
    };
    reader.onerror = () => reject(new Error("Image conversion failed"));
    reader.readAsDataURL(file);
  });
}

export function formatTeacherName(
  teacher: Pick<Teacher, "firstName" | "lastName" | "middleName">,
): string {
  return `${teacher.lastName}, ${teacher.firstName}${teacher.middleName ? ` ${teacher.middleName.charAt(0)}.` : ""}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getSyncFilterValue(
  teacher: Teacher,
): Exclude<TeacherSyncFilter, "all"> {
  const status = teacher.atlasSync?.status;

  if (!status || status === "SKIPPED") {
    return "UNSYNCED";
  }

  return status;
}

export function formatDesignationSummary(teacher: Teacher): string {
  const designation = teacher.designation;
  if (!designation) {
    return "-";
  }

  const tags: string[] = [];
  if (designation.isClassAdviser) tags.push("ADVISER");
  if (designation.isTic) tags.push("TIC");
  if (designation.isTeachingExempt) tags.push("EXEMPT");

  return tags.length > 0 ? tags.join(" · ") : "None";
}

export function formatAdvisorySectionSummary(teacher: Teacher): string {
  if (!teacher.designation?.advisorySection) {
    return "-";
  }

  const section = teacher.designation.advisorySection;
  return `${section.gradeLevelName ?? "Grade"} - ${section.name}`;
}

export function getSyncDetailText(teacher: Teacher): string {
  const sync = teacher.atlasSync;

  if (!sync || sync.status === "SKIPPED") {
    return "Waiting for first ATLAS sync";
  }

  if (sync.status === "SYNCED") {
    return sync.acknowledgedAt
      ? `ATLAS confirmed receipt on ${formatDateTime(sync.acknowledgedAt)}`
      : "Sent to ATLAS successfully";
  }

  if (sync.status === "PENDING") {
    return sync.nextRetryAt
      ? `Retry scheduled ${formatDateTime(sync.nextRetryAt)} (attempt ${sync.attemptCount}/${sync.maxAttempts})`
      : `Sync in progress (attempt ${sync.attemptCount}/${sync.maxAttempts})`;
  }

  const httpStatus = sync.httpStatus
    ? `HTTP ${sync.httpStatus}`
    : "Sync failed";
  const errorSnippet = sync.errorMessage
    ? sync.errorMessage.slice(0, 56)
    : "Check ATLAS sync health for details";

  return `Action needed: ${httpStatus} · ${errorSnippet}`;
}

export function getSyncDetailClassName(teacher: Teacher): string {
  const status = teacher.atlasSync?.status;
  if (status === "FAILED") {
    return "text-destructive";
  }
  if (status === "PENDING") {
    return "text-amber-700";
  }
  return "text-muted-foreground";
}
