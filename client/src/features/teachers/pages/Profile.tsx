import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  ShieldAlert,
  Smartphone,
  User as UserIcon,
  UserRoundPen,
  Users,
  BookOpen,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { cn, formatUserRole, getGradeLevelBadgeStyles } from "@/shared/lib/utils";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { UserPhoto } from "@/shared/components/UserPhoto";
import { useAuthStore } from "@/store/auth.slice";
import { useSettingsStore } from "@/store/settings.slice";
import {
  DEPED_TEACHER_ANCILLARY_ROLE_OPTIONS,
  DEPED_TEACHER_DEPARTMENT_OPTIONS,
} from "@enrollpro/shared";
import type { Teacher, TeacherSchedulePeriod } from "../types";
import { formatTeacherName } from "../utils";
import { TeacherDetailPanel } from "../components/TeacherDetailPanel";

const ROLE_LABEL_MAP: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  PRINCIPAL: "School Head",
  HEAD_REGISTRAR: "Head Registrar",
  SCHOOL_REGISTRAR: "School Registrar",
  TEACHER: "Teacher",
  CLASS_ADVISER: "Class Adviser",
  GRADE_LEVEL_COORDINATOR: "Grade Level Coordinator",
  STE_COORDINATOR: "STE Coordinator",
  SPA_COORDINATOR: "SPA Coordinator",
  SPS_COORDINATOR: "SPS Coordinator",
  MRF: "MRF Coordinator",
};

const SERVICE_STATUS_LABEL_MAP: Record<string, string> = {
  ACTIVE: "Active Personnel",
  ON_LEAVE: "On Leave",
  TRANSFERRED: "Transferred",
  RETIRED_RESIGNED: "Retired / Resigned",
  DROPPED_FROM_ROLLS: "Dropped from Rolls",
};

const NATURE_OF_APPOINTMENT_MAP: Record<string, string> = {
  REGULAR_PERMANENT: "Regular / Permanent",
  PROVISIONAL: "Provisional",
  SUBSTITUTE: "Substitute",
  CONTRACTUAL: "Contractual",
  VOLUNTEER: "Volunteer",
  LOCAL_SCHOOL_BOARD: "Local School Board",
  OTHER: "Other",
};

const FUNDING_SOURCE_MAP: Record<string, string> = {
  NATIONAL: "National",
  SPECIAL_EDUCATION_FUND: "Special Education Fund",
  LOCAL_SCHOOL_BOARD: "Local School Board",
  PTA: "PTA",
  NGO: "NGO",
  OTHER: "Other",
};

interface TeacherProfileResponse {
  teacher: Teacher & {
    schedulePeriods?: TeacherSchedulePeriod[];
    advisoryHistory?: {
      id: number;
      section: {
        id: number;
        name: string;
        gradeLevel?: { name: string };
        programType?: string;
      };
      schoolYear?: {
        id: number;
        name: string;
      };
      effectiveFrom: string;
      effectiveTo: string | null;
      status: string;
      handoverReason: string | null;
    }[];
  };
}

// View Mode: grid row helper exactly matching TeacherDetailPanel
const ViewRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-[180px_1fr] divide-x divide-border">
    <div className="p-3 text-foreground bg-muted/30 capitalize font-extrabold">
      {label}
    </div>
    <div className="p-3 uppercase">
      {value || "—"}
    </div>
  </div>
);

export default function PersonnelProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const activeSchoolYearLabel = useSettingsStore((state) => state.activeSchoolYearLabel);

  const [teacher, setTeacher] = useState<TeacherProfileResponse["teacher"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const canEdit = useMemo(() => {
    return (
      currentUser?.roles?.includes("SYSTEM_ADMIN") ||
      currentUser?.roles?.includes("PRINCIPAL")
    );
  }, [currentUser]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = id ? `/teachers/${encodeURIComponent(id)}` : `/teachers/profile`;
      const res = await api.get<TeacherProfileResponse>(endpoint);
      setTeacher(res.data.teacher);
    } catch (err: unknown) {
      setError("Unable to load personnel profile. You may not have permission or the record does not exist.");
      toastApiError(err as never);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, refreshCount]);

  const formatAncillaryRole = (role: string) => {
    const match = DEPED_TEACHER_ANCILLARY_ROLE_OPTIONS.find((opt) => opt.value === role);
    return match?.label ?? role;
  };

  const handleBack = () => {
    if (canEdit && window.history.length > 1) {
      navigate("/personnel/directory");
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/personnel/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center">
          <Button variant="outline" size="sm" disabled className="font-bold uppercase">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="min-h-0 flex-1 rounded-md border bg-background p-6 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm font-bold uppercase text-muted-foreground">Loading Personnel Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="font-bold uppercase">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="min-h-0 flex-1 rounded-md border bg-background p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <ShieldAlert className="size-12 text-destructive mb-2" />
          <p className="text-base font-bold text-foreground uppercase">
            {error || "Personnel Record Not Found"}
          </p>
          <Button variant="outline" onClick={handleBack} className="font-bold uppercase">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const portalIsActive = teacher.userAccount?.isActive ?? teacher.isActive ?? true;
  const rawRoles = teacher.userAccount?.roles || (teacher.employeeId === currentUser?.employeeId ? currentUser?.roles : []) || [];
  const ancillaryList = teacher.ancillaryRoles || teacher.designation?.ancillaryRoles || [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      {/* ─── Top Bar: Back Button ─── */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="font-bold uppercase text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {canEdit ? "Back to Personnel Directory" : "Back to Previous Page"}
        </Button>
      </div>

      {/* ─── Full-Page Profile Scroll Container ─── */}
      <div className="min-h-0 flex-1 rounded-md border bg-background relative">
        <div className="absolute inset-0 overflow-y-auto p-3 sm:p-4 space-y-4 font-bold">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* SUMMARY BLOCK (Matches StudentDetailPanel & TeacherDetailPanel) */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-[hsl(var(--muted))] p-4 sm:p-6 rounded-md border">
            {/* Top Row: Identity & Actions */}
            <div className="flex justify-between items-start">
              {/* Left Side: Media Object */}
              <div className="flex items-start gap-4 sm:gap-6">
                <UserPhoto
                  photo={teacher.photoPath}
                  containerClassName="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-primary border-dashed shadow-md shrink-0"
                  className="w-full h-full object-cover rounded-full"
                  fallbackIcon={
                    <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl uppercase bg-primary">
                      {(teacher.firstName || "U").charAt(0)}
                      {(teacher.lastName || "P").charAt(0)}
                    </div>
                  }
                />
                <div className="flex flex-col mt-1">
                  <h3 className="text-2xl font-extrabold text-foreground leading-tight uppercase break-words">
                    {formatTeacherName(teacher)}
                  </h3>
                  <p className="font-bold uppercase mb-2 text-lg">
                    Employee ID: {teacher.employeeId || "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {rawRoles.length > 0 ? (
                      rawRoles.map((role) => (
                        <Badge
                          key={role}
                          className="bg-primary text-primary-foreground rounded-full uppercase shadow-sm px-3 py-0.5 text-sm font-bold border-0"
                        >
                          {ROLE_LABEL_MAP[role] || formatUserRole(role)}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 px-3 py-1 rounded-full uppercase shadow-sm font-bold text-muted-foreground border-0"
                      >
                        No roles
                      </Badge>
                    )}

                    {ancillaryList.map((ancillary) => (
                      <Badge
                        key={ancillary}
                        variant="secondary"
                        className={cn(
                          "px-3 py-0.5 rounded-full uppercase shadow-sm font-bold text-sm border",
                          ancillary.includes("GRADE")
                            ? getGradeLevelBadgeStyles(ancillary)
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {formatAncillaryRole(ancillary)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Action Button (Admin/Principal Edit) */}
              {canEdit && (
                <div className="shrink-0 ml-4 hidden sm:flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="font-bold text-sm h-9 px-4 uppercase border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm rounded-md transition-all active:scale-[0.98] w-full justify-start cursor-pointer"
                    onClick={() => setIsEditPanelOpen(true)}
                  >
                    <UserRoundPen className="mr-2 h-4 w-4 shrink-0" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Edit Button */}
            {canEdit && (
              <div className="mt-4 sm:hidden flex flex-col gap-2 w-full">
                <Button
                  variant="outline"
                  className="font-bold text-sm h-9 px-4 uppercase border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm rounded-md transition-all active:scale-[0.98] w-full cursor-pointer"
                  onClick={() => setIsEditPanelOpen(true)}
                >
                  <UserRoundPen className="mr-2 h-4 w-4 shrink-0" />
                  Edit Profile
                </Button>
              </div>
            )}

            {/* Position & Contact Number Row */}
            <div className="mt-6 mb-4">
              <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
                <div className="text-base leading-tight font-bold divide-y divide-border">
                  {/* Header Row */}
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-3 text-foreground bg-muted/30 font-extrabold text-center capitalize">
                      Position
                    </div>
                    <div className="p-3 text-foreground bg-muted/30 font-extrabold text-center capitalize">
                      Contact Number
                    </div>
                  </div>
                  {/* Value Row */}
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-3 flex items-center justify-center uppercase min-w-0">
                      <span className="text-base font-bold text-foreground text-center">
                        {teacher.plantillaPosition || teacher.designationTitle || "—"}
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-center uppercase min-w-0">
                      <span className="text-base font-bold text-foreground leading-tight uppercase tabular-nums text-center">
                        {teacher.contactNumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* VIEW MODE CARDS (Matches TeacherDetailPanel lines 1022-1165)*/}
          {/* ════════════════════════════════════════════════════════════ */}

          {/* 1. Personal Information */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center gap-2 uppercase">
              <UserIcon className="h-4 w-4 text-primary" />
              Personal Information
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <ViewRow label="First Name" value={teacher.firstName} />
              <ViewRow label="Middle Name" value={teacher.middleName} />
              <ViewRow label="Last Name" value={teacher.lastName} />
              {Boolean(teacher.suffix?.trim()) && (
                <ViewRow label="Suffix" value={teacher.suffix} />
              )}
              <ViewRow label="Sex" value={teacher.sex} />
              <ViewRow
                label="Date of Birth"
                value={
                  teacher.birthdate
                    ? new Date(teacher.birthdate).toLocaleDateString(undefined, {
                        timeZone: "Asia/Manila",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : null
                }
              />
              <ViewRow label="Mobile No." value={teacher.contactNumber} />
              {teacher.indigenousCommunity &&
                teacher.indigenousCommunity !== "NOT_APPLICABLE" &&
                teacher.indigenousCommunity !== "NOT APPLICABLE" && (
                  <ViewRow label="IP Community" value={teacher.indigenousCommunity} />
                )}
            </div>
          </div>

          {/* 2. Employment Details */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center gap-2 uppercase">
              <Briefcase className="h-4 w-4 text-primary" />
              Employment Details
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <ViewRow
                label="Personnel Type"
                value={
                  teacher.personnelType === "TEACHING"
                    ? "Teaching"
                    : teacher.personnelType === "NON_TEACHING"
                    ? "Non-Teaching"
                    : "—"
                }
              />
              <ViewRow label="Position" value={teacher.plantillaPosition} />
              {teacher.personnelType === "TEACHING" && (
                <ViewRow
                  label="Subject Area"
                  value={(teacher.departments || [])
                    .map(
                      (d) =>
                        DEPED_TEACHER_DEPARTMENT_OPTIONS.find((opt) => opt.value === d)?.label ||
                        d
                    )
                    .join(", ")}
                />
              )}
              {teacher.personnelType === "NON_TEACHING" && (
                <ViewRow label="Office" value={teacher.functionalAssignment} />
              )}
              <ViewRow
                label="Appointment"
                value={
                  NATURE_OF_APPOINTMENT_MAP[teacher.natureOfAppointment] ||
                  teacher.natureOfAppointment
                }
              />
              <ViewRow
                label="Fund Source"
                value={FUNDING_SOURCE_MAP[teacher.fundingSource] || teacher.fundingSource}
              />
              <ViewRow
                label="Ancillary Roles"
                value={
                  ancillaryList.length > 0
                    ? ancillaryList.map(formatAncillaryRole).join(", ")
                    : "—"
                }
              />
            </div>
          </div>

          {/* 3. ATLAS Configuration */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center justify-between uppercase">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                ATLAS Access Options
              </span>
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <ViewRow
                label="Assign Teaching Load"
                value={teacher.designation?.atlasAssignTeachingLoad ? "Yes" : "No"}
              />
              <ViewRow
                label="Build Schedules"
                value={teacher.designation?.atlasBuildSchedules ? "Yes" : "No"}
              />
            </div>
          </div>

          {/* 4. SF7 Profile */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center justify-between uppercase">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                SF7 Profile
              </span>
              <Badge variant="outline" className="font-bold uppercase">
                School Form 7
              </Badge>
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <ViewRow label="Bachelor Degree" value={teacher.undergraduateDegree} />
              <ViewRow label="Bachelor Major" value={teacher.bachelorMajor} />
              <ViewRow label="Bachelor Minor" value={teacher.bachelorMinor} />
              <ViewRow
                label="Postgrad"
                value={
                  teacher.postgraduateDegrees?.length
                    ? teacher.postgraduateDegrees.map((entry) => entry.degree).join(" / ")
                    : teacher.postgraduateDegree
                }
              />
              <ViewRow
                label="Major"
                value={
                  teacher.postgraduateDegrees?.length
                    ? teacher.postgraduateDegrees
                        .map((entry) => entry.major)
                        .filter(Boolean)
                        .join(" / ")
                    : teacher.majorSpecialization
                }
              />
              <ViewRow
                label="Minor"
                value={
                  teacher.postgraduateDegrees?.length
                    ? teacher.postgraduateDegrees
                        .map((entry) => entry.minor)
                        .filter(Boolean)
                        .join(" / ")
                    : teacher.minorSpecialization
                }
              />
            </div>
          </div>

          {/* 5. Active Advisory Section (if any) */}
          {teacher.designation?.advisorySection && (
            <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
              <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center justify-between uppercase">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Active Advisory Section
                </span>
                {teacher.designation?.isClassAdviser && (
                  <Badge className="bg-primary text-primary-foreground font-bold uppercase text-xs">
                    Class Adviser
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md border bg-muted/20">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase text-foreground">
                      {teacher.designation.advisorySection.gradeLevelName || "Grade"} — {teacher.designation.advisorySection.name}
                    </h4>
                    <p className="text-sm font-bold text-muted-foreground uppercase">
                      Current Advisory Class for S.Y. {activeSchoolYearLabel || "Active"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="font-bold text-sm uppercase"
                    onClick={() => {
                      if (teacher.employeeId === currentUser?.employeeId) {
                        navigate("/personnel/teacher/advisory");
                      } else {
                        navigate(`/personnel/sections/view-masterlist/${teacher.designation?.advisorySection?.id}`);
                      }
                    }}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Class Masterlist
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Weekly Teaching Schedule Periods (if any) */}
          {teacher.schedulePeriods && teacher.schedulePeriods.length > 0 && (
            <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
              <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center justify-between uppercase">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Weekly Teaching Schedule Periods
                </span>
                <Badge variant="outline" className="font-bold uppercase text-xs">
                  {teacher.schedulePeriods.length} Periods
                </Badge>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-black">
                      <tr>
                        <th className="p-3">Day</th>
                        <th className="p-3">Time</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-bold">
                      {teacher.schedulePeriods.map((period) => (
                        <tr key={period.id} className="hover:bg-muted/20">
                          <td className="p-3 font-extrabold text-primary uppercase">
                            {period.dayOfWeek}
                          </td>
                          <td className="p-3 font-mono">
                            {period.startTime} – {period.endTime}
                          </td>
                          <td className="p-3 uppercase">
                            {period.subjectLabel || "—"}
                          </td>
                          <td className="p-3 uppercase">
                            {period.sectionLabel || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. Advisory Assignment History (if any) */}
          {teacher.advisoryHistory && teacher.advisoryHistory.length > 0 && (
            <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
              <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center gap-2 uppercase">
                <Calendar className="h-4 w-4 text-primary" />
                Advisory Assignment History
              </div>
              <div className="p-4">
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-black">
                      <tr>
                        <th className="p-3">School Year</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-bold">
                      {teacher.advisoryHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-muted/20">
                          <td className="p-3 font-extrabold text-foreground uppercase">
                            {history.schoolYear?.name || "—"}
                          </td>
                          <td className="p-3 uppercase">
                            {history.section?.gradeLevel?.name || "Grade"} — {history.section?.name || "—"}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {new Date(history.effectiveFrom).toLocaleDateString("en-PH")}
                            {history.effectiveTo
                              ? ` to ${new Date(history.effectiveTo).toLocaleDateString("en-PH")}`
                              : " – Present"}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={history.status === "ACTIVE" ? "default" : "secondary"}
                              className="font-bold text-[10px] uppercase"
                            >
                              {history.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. Service Status */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center gap-2 uppercase">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Service Status
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <ViewRow
                label="Status"
                value={
                  SERVICE_STATUS_LABEL_MAP[teacher.serviceStatus] || teacher.serviceStatus
                }
              />
              {teacher.serviceStatus !== "ACTIVE" && (
                <>
                  <ViewRow
                    label="Effective Date"
                    value={
                      (teacher as Teacher & { serviceEffectiveDate?: string | null })
                        .serviceEffectiveDate
                        ? new Date(
                            (teacher as Teacher & { serviceEffectiveDate?: string | null })
                              .serviceEffectiveDate!
                          ).toLocaleDateString(undefined, {
                            timeZone: "Asia/Manila",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : null
                    }
                  />
                  <ViewRow
                    label="Notes"
                    value={
                      (teacher as Teacher & { serviceRemarks?: string | null }).serviceRemarks
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* 9. Portal Access and Security */}
          <div className="border rounded-md bg-[hsl(var(--card))] overflow-hidden">
            <div className="p-3 font-extrabold text-base leading-tight bg-[hsl(var(--muted)/50)] border-b flex items-center gap-2 uppercase">
              <Smartphone className="h-4 w-4 text-primary" />
              Portal Access and Security
            </div>
            <div className="text-base leading-tight font-bold divide-y divide-border">
              <div className="grid grid-cols-[180px_1fr] divide-x divide-border">
                <div className="p-3 text-foreground bg-muted/30 capitalize font-extrabold">
                  Portal
                </div>
                <div className="p-3 uppercase flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      portalIsActive ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  {portalIsActive ? "Active — Login Allowed" : "Disabled — Login Blocked"}
                </div>
              </div>
              <ViewRow
                label="Last Login"
                value={
                  teacher.userAccount?.lastLoginAt
                    ? new Date(teacher.userAccount.lastLoginAt).toLocaleDateString(undefined, {
                        timeZone: "Asia/Manila",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Never"
                }
              />
            </div>
          </div>

          {/* Record created footer */}
          <div className="mt-4 p-3 bg-muted/10 text-center rounded-xl">
            <p className="text-sm font-bold text-foreground uppercase tracking-widest">
              Record created{" "}
              {teacher.createdAt
                ? new Date(teacher.createdAt).toLocaleString(undefined, {
                    timeZone: "Asia/Manila",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "date not available"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Admin/Principal Edit Drawer ─── */}
      {canEdit && (
        <TeacherDetailPanel
          open={isEditPanelOpen}
          teacher={teacher}
          onOpenChange={setIsEditPanelOpen}
          onSaveSuccess={() => {
            setIsEditPanelOpen(false);
            setRefreshCount((c) => c + 1);
          }}
        />
      )}
    </div>
  );
}
