import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  Users,
  CheckCircle,
  AlertTriangle,
  UserCog,
  Mail,
  Activity,
  ShieldCheck,
  FileText,
  FileCheck,
  GitPullRequest,
} from "lucide-react";
import api from "@/shared/api/axiosInstance";
import { useAuthStore } from "@/store/auth.slice";
import { useSettingsStore } from "@/store/settings.slice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useDelayedLoading } from "@/shared/hooks/useDelayedLoading";

interface Stats {
  totalPending: number;
  totalEnrolled: number;
  totalPreRegistered: number;
  sectionsAtCapacity: number;
  actions?: {
    pendingReview: number;
    sectionsAtCapacity: number;
  };
  enrollmentTarget?: {
    current: number;
    target: number;
    seatsRemaining: number;
    progressPercent: number;
  };
  earlyRegistration?: {
    submitted: number;
    verified: number;
    examScheduled?: number;
    readyForEnrollment?: number;
    enrolled?: number;
    inPipeline?: number;
    total: number;
  };
}

interface AdminStats {
  activeUsers: number;
  usersByRole: Record<string, number>;
  emailDeliveryRate: string;
  systemStatus: string;
}

type FocusOverride = "AUTO" | "EARLY" | "ENROLLMENT";
type FocusMode = "EARLY" | "ENROLLMENT" | "BALANCED";

const ACTION_THRESHOLDS = {
  pendingReview: 15,
  sectionsAtCapacity: 2,
};

function formatMetric(value: number): string {
  return Number(value || 0).toLocaleString("en-PH");
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatFocusMode(mode: FocusMode): string {
  if (mode === "EARLY") return "Early Registration";
  if (mode === "ENROLLMENT") return "Enrollment Progress";
  return "Balanced";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { enrollmentPhase } = useSettingsStore();
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const [stats, setStats] = useState<Stats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusOverride, setFocusOverride] = useState<FocusOverride>("AUTO");

  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, adminRes] = await Promise.all([
          api.get("/dashboard/stats"),
          isAdmin
            ? api.get("/admin/dashboard/stats")
            : Promise.resolve({ data: null }),
        ]);

        setStats(statsRes.data.stats);
        if (adminRes.data) setAdminStats(adminRes.data);
      } catch {
        setStats({
          totalPending: 0,
          totalEnrolled: 0,
          totalPreRegistered: 0,
          sectionsAtCapacity: 0,
          actions: {
            pendingReview: 0,
            sectionsAtCapacity: 0,
          },
          enrollmentTarget: {
            current: 0,
            target: 0,
            seatsRemaining: 0,
            progressPercent: 0,
          },
          earlyRegistration: {
            submitted: 0,
            verified: 0,
            examScheduled: 0,
            readyForEnrollment: 0,
            enrolled: 0,
            inPipeline: 0,
            total: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const autoFocus = useMemo<FocusMode>(() => {
    if (enrollmentPhase === "EARLY_REGISTRATION") {
      return "EARLY";
    }

    if (
      enrollmentPhase === "REGULAR_ENROLLMENT" ||
      enrollmentPhase === "OVERRIDE"
    ) {
      return "ENROLLMENT";
    }

    return "BALANCED";
  }, [enrollmentPhase]);

  const effectiveFocus: FocusMode =
    focusOverride === "AUTO" ? autoFocus : focusOverride;
  const isEnrollmentExpanded = effectiveFocus !== "EARLY";
  const isEarlyRegistrationExpanded = effectiveFocus !== "ENROLLMENT";

  const pendingReviewCount =
    stats?.actions?.pendingReview ?? stats?.totalPending ?? 0;
  const sectionsAtCapacityCount =
    stats?.actions?.sectionsAtCapacity ?? stats?.sectionsAtCapacity ?? 0;
  const pendingReviewAlert =
    pendingReviewCount >= ACTION_THRESHOLDS.pendingReview;
  const sectionsCapacityAlert =
    sectionsAtCapacityCount >= ACTION_THRESHOLDS.sectionsAtCapacity;

  const enrollmentCurrent =
    stats?.enrollmentTarget?.current ?? stats?.totalEnrolled ?? 0;
  const enrollmentTarget = stats?.enrollmentTarget?.target ?? 0;
  const enrollmentProgress =
    stats?.enrollmentTarget?.progressPercent ??
    (enrollmentTarget > 0
      ? Number(((enrollmentCurrent / enrollmentTarget) * 100).toFixed(1))
      : 0);
  const enrollmentProgressClamped = clampProgress(enrollmentProgress);
  const seatsRemaining =
    stats?.enrollmentTarget?.seatsRemaining ??
    Math.max(enrollmentTarget - enrollmentCurrent, 0);

  const focusStateLabel =
    focusOverride === "AUTO"
      ? `Auto | ${formatFocusMode(autoFocus)}`
      : `Manual | ${formatFocusMode(focusOverride)}`;

  const earlyRegCards = [
    {
      title: "Submitted",
      value: stats?.earlyRegistration?.submitted ?? 0,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Exam Scheduled",
      value: stats?.earlyRegistration?.examScheduled ?? 0,
      icon: GitPullRequest,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Ready for Enrollment",
      value: stats?.earlyRegistration?.readyForEnrollment ?? 0,
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Verified",
      value: stats?.earlyRegistration?.verified ?? 0,
      icon: FileCheck,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Enrolled",
      value: stats?.earlyRegistration?.enrolled ?? stats?.totalEnrolled ?? 0,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const adminCards = [
    {
      title: "Active Users",
      value: adminStats?.activeUsers ?? 0,
      description: `${adminStats?.usersByRole["REGISTRAR"] || 0} Registrars | ${adminStats?.usersByRole["TEACHER"] || 0} Teachers`,
      icon: UserCog,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Email Delivery",
      value: `${adminStats?.emailDeliveryRate ?? "0.0"}%`,
      description: "Last 30 days success rate",
      icon: Mail,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "System Status",
      value: adminStats?.systemStatus === "OK" ? "Healthy" : "Error",
      description: "Database & Core Services",
      icon: Activity,
      color:
        adminStats?.systemStatus === "OK" ? "text-green-600" : "text-red-600",
      bg: adminStats?.systemStatus === "OK" ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-semibold text-primary">
              {user?.firstName} {user?.lastName}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Badge
            variant="outline"
            className="h-6 gap-1 border-primary border-opacity-20 bg-sidebar-accent text-primary">
            <ShieldCheck className="h-3 w-3" />
            {user?.role} Access
          </Badge>

          <div className="flex flex-col items-start gap-1 md:items-end">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Seasonal Focus
            </p>
            <div
              className="inline-flex rounded-lg border bg-card p-1"
              role="group"
              aria-label="Command center seasonal focus">
              {(["AUTO", "EARLY", "ENROLLMENT"] as const).map((mode) => {
                const selected = focusOverride === mode;

                return (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "ghost"}
                    onClick={() => setFocusOverride(mode)}
                    className="h-7 px-2 text-[11px] font-bold uppercase tracking-wide">
                    {mode}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <section className="space-y-3" aria-label="System oversight">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 opacity-80">
              System Oversight
            </h2>
            <div className="h-px flex-1 bg-purple-100"></div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {adminCards.map((stat) => (
              <Card
                key={stat.title}
                className="border-purple-100 bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                  <CardTitle className="text-[0.625rem] font-bold uppercase tracking-wider text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bg} rounded-md p-2`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>

                <CardContent className="pb-3 pt-0">
                  {showSkeleton ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-lg font-black leading-none">
                        {stat.value}
                      </div>
                      <p className="mt-1 text-[0.625rem] text-muted-foreground">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4" aria-label="Enrollment progress">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary opacity-80">
            Enrollment Progress
          </h2>
          <div className="h-px flex-1 bg-sidebar-accent"></div>
        </div>

        {isEnrollmentExpanded ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg font-black tracking-tight">
                      Total Enrolled
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Main Goal
                    </Badge>
                  </div>
                  <CardDescription>
                    Active school-year enrollment against total section
                    capacity.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {showSkeleton ? (
                    <>
                      <Skeleton className="h-10 w-44" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-4 w-64" />
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-4xl font-black leading-none text-emerald-700">
                            {formatMetric(enrollmentCurrent)}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-emerald-900/80">
                            {formatMetric(enrollmentCurrent)} /{" "}
                            {formatMetric(enrollmentTarget)} seats filled
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-800">
                          {enrollmentProgress.toFixed(1)}%
                        </p>
                      </div>

                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(enrollmentProgressClamped)}
                        aria-label="Enrollment progress toward section capacity"
                        className="h-2.5 w-full rounded-full bg-emerald-100">
                        <div
                          className="h-2.5 rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${enrollmentProgressClamped}%` }}
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {enrollmentTarget === 0
                          ? "Section capacity target is unavailable until sections are configured."
                          : seatsRemaining > 0
                            ? `${formatMetric(seatsRemaining)} seats remaining before reaching target capacity.`
                            : "Capacity target reached. Consider opening additional sections if intake continues."}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-black tracking-tight">
                    Focus State
                  </CardTitle>
                  <CardDescription>
                    Command center view adapts to the enrollment season.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {showSkeleton ? (
                    <>
                      <Skeleton className="h-7 w-28" />
                      <Skeleton className="h-4 w-48" />
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="font-bold">
                        {focusStateLabel}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Enrollment phase: {enrollmentPhase.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        High-priority bottlenecks are surfaced below as direct
                        action cards.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card
                className={`shadow-sm transition-colors ${pendingReviewAlert ? "border-amber-300 bg-amber-50/70" : "border-slate-200 bg-white"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Pending Review
                    </CardTitle>
                    <div
                      className={`rounded-md p-2 ${pendingReviewAlert ? "bg-amber-100" : "bg-slate-100"}`}>
                      <ClipboardList
                        className={`h-4 w-4 ${pendingReviewAlert ? "text-amber-700" : "text-slate-600"}`}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {showSkeleton ? (
                    <>
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-44" />
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-black">
                        {formatMetric(pendingReviewCount)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pendingReviewAlert
                          ? "Review queue is above threshold. Immediate registrar action is recommended."
                          : "Queue is within normal range. Continue monitoring throughout the day."}
                      </p>
                    </>
                  )}

                  <Button
                    type="button"
                    className="w-full justify-start"
                    variant={pendingReviewAlert ? "default" : "outline"}
                    onClick={() =>
                      navigate(
                        "/monitoring/enrollment?workflow=PENDING_VERIFICATION",
                      )
                    }>
                    {pendingReviewCount > 0
                      ? `-> Review ${formatMetric(pendingReviewCount)} Applications`
                      : "-> Open Pending Verification Queue"}
                  </Button>
                </CardContent>
              </Card>

              <Card
                className={`shadow-sm transition-colors ${sectionsCapacityAlert ? "border-red-300 bg-red-50/70" : "border-slate-200 bg-white"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Sections at Capacity
                    </CardTitle>
                    <div
                      className={`rounded-md p-2 ${sectionsCapacityAlert ? "bg-red-100" : "bg-slate-100"}`}>
                      <AlertTriangle
                        className={`h-4 w-4 ${sectionsCapacityAlert ? "text-red-700" : "text-slate-600"}`}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {showSkeleton ? (
                    <>
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-44" />
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-black">
                        {formatMetric(sectionsAtCapacityCount)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sectionsCapacityAlert
                          ? "Capacity pressure detected. Open sections management to rebalance before lockouts occur."
                          : "No immediate section bottlenecks detected. Keep monitoring fill rates."}
                      </p>
                    </>
                  )}

                  <Button
                    type="button"
                    className="w-full justify-start"
                    variant={sectionsCapacityAlert ? "destructive" : "outline"}
                    onClick={() => navigate("/sections")}>
                    {sectionsAtCapacityCount > 0
                      ? "-> Manage Sections"
                      : "-> Open Sections Workspace"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black tracking-tight">
                Enrollment Summary
              </CardTitle>
              <CardDescription>
                Collapsed while Early Registration focus is active.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {showSkeleton ? (
                <Skeleton className="h-8 w-44" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-bold">
                    Enrolled: {formatMetric(enrollmentCurrent)}
                  </Badge>
                  <Badge variant="secondary" className="font-bold">
                    Pending Review: {formatMetric(pendingReviewCount)}
                  </Badge>
                  <Badge variant="secondary" className="font-bold">
                    Capacity Alerts: {formatMetric(sectionsAtCapacityCount)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4" aria-label="Early registration">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 opacity-80">
            Early Registration
          </h2>
          <div className="h-px flex-1 bg-amber-100"></div>
        </div>

        {isEarlyRegistrationExpanded ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {earlyRegCards.map((stat) => (
              <Card
                key={stat.title}
                className="border-amber-100 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bg} rounded-md p-2`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>

                <CardContent>
                  {showSkeleton ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-black">
                      {formatMetric(stat.value)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-amber-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black tracking-tight">
                Early Registration Summary
              </CardTitle>
              <CardDescription>
                Condensed while Enrollment Progress focus is active.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {showSkeleton ? (
                <Skeleton className="h-8 w-52" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-bold">
                    Submitted:{" "}
                    {formatMetric(stats?.earlyRegistration?.submitted ?? 0)}
                  </Badge>
                  <Badge variant="secondary" className="font-bold">
                    Exam Scheduled:{" "}
                    {formatMetric(stats?.earlyRegistration?.examScheduled ?? 0)}
                  </Badge>
                  <Badge variant="secondary" className="font-bold">
                    Ready for Enrollment:{" "}
                    {formatMetric(
                      stats?.earlyRegistration?.readyForEnrollment ?? 0,
                    )}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-opacity-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Overview</CardTitle>
            <CardDescription>
              Trend charts and distribution widgets for the active school year
              will appear here.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex h-40 flex-col items-center justify-center space-y-2 text-center">
              <div className="rounded-full bg-muted p-3">
                <Activity className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>
              <p className="max-w-52 text-xs text-muted-foreground">
                This panel is reserved for enrollment trend visualization and
                forecast snapshots.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-opacity-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Recent System Logs
            </CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No recent activity to display.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
