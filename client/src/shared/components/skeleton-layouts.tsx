import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { isLoggingOut } from "@/shared/lib/logoutState";
import AdmissionHeader from "@/features/admission/components/AdmissionHeader";
import { useSettingsStore } from "@/store/settings.slice";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export type SkeletonPageVariant =
  | "dashboard"
  | "registry"
  | "cardGrid"
  | "twoPanel"
  | "settings"
  | "detail"
  | "modal"
  | "form"
  | "generic"
  | "enrollmentForm"
  | "learnerProfile"
  | "bosy"
  | "systemHealth"
  | "advisory"
  | "roster"
  | "personnelProfile"
  | "help"
  | "eosy"
  | "learnerAdmission"
  | "homerooms"
  | "teachersDirectory"
  | "studentsMasterlist"
  | "earlyRegistration"
  | "auditLogs"
  | "earlyRegistrationOnline"
  | "enrollmentOnline"
  | "scpAdmissionOnline"
  | "trackApplicationOnline"
  | "monitorOnline"
  | "onlineAdmission"
  | "onlineTrackStatus";

interface SkeletonLayoutProps {
  className?: string;
}

interface PageLoadingSkeletonProps extends SkeletonLayoutProps {
  withDelay?: boolean;
  variant?: SkeletonPageVariant;
}

export function SkeletonPageHeader({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60",
        className,
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64 rounded-lg" />
        <Skeleton className="h-4 w-64 sm:w-80 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function MetricCardSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToolbarSkeleton({
  controls = 3,
  className,
}: {
  controls?: number;
  className?: string;
}) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex-1 max-w-md">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: controls }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 sm:w-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function DataTableSkeleton({
  rows = 10,
  columns = 5,
  dense = false,
  className,
}: {
  rows?: number;
  columns?: number;
  dense?: boolean;
  className?: string;
}) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col flex-1",
        className,
      )}
    >
      {/* Table Header */}
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4 rounded",
              i === 0 ? "w-40" : i === 1 ? "w-28" : "w-20",
            )}
          />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-border/60 flex-1">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className={cn(
              "px-4 flex items-center justify-between gap-4 transition-colors",
              dense ? "py-2.5" : "py-3.5",
              rIdx % 2 === 0 ? "bg-card" : "bg-muted/15",
            )}
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={cn(
                  "flex items-center gap-2",
                  cIdx === 0 ? "w-48" : "flex-1",
                )}
              >
                {cIdx === 0 && (
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                )}
                <div className="space-y-1 flex-1">
                  <Skeleton
                    className={cn(
                      "h-4 rounded",
                      cIdx === 0 ? "w-32" : "w-20",
                    )}
                  />
                  {cIdx === 0 && <Skeleton className="h-3 w-20 rounded" />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Table Pagination footer */}
      <div className="border-t border-border bg-muted/20 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-6 w-36 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({
  sections = 3,
  className,
}: {
  sections?: number;
  className?: string;
}) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "space-y-6 max-w-4xl mx-auto p-6 bg-card rounded-xl border border-border shadow-sm",
        className,
      )}
    >
      <div className="space-y-2 pb-4 border-b border-border/60">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-4 pt-4 border-t border-border/60">
          <Skeleton className="h-5 w-40 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function TwoPanelSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row flex-1 h-[calc(100vh-140px)] min-h-0 border border-border rounded-xl bg-card overflow-hidden shadow-sm",
        className,
      )}
    >
      {/* Left Panel */}
      <div className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-border p-5 flex flex-col space-y-4 bg-muted/10">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3.5 w-60 rounded" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-2.5 flex-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg border border-border/80 bg-background flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Right Panel */}
      <div className="flex-1 p-5 flex flex-col space-y-4 bg-card overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-72 rounded" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-background space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-36 rounded" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-14 rounded-md" />
                <Skeleton className="h-6 w-14 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailPanelSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "p-6 space-y-5 rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-4/6 rounded" />
      </div>
    </div>
  );
}

export function ModalBodySkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("p-4 space-y-4", className)}>
      <Skeleton className="h-6 w-48 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export function LearnerProfileSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full h-full min-h-[calc(100vh-56px)] overflow-hidden bg-background",
        className,
      )}
    >
      {/* Left Sidebar Skeleton */}
      <aside className="hidden md:flex md:w-[30%] bg-muted/20 border-r border-border h-full flex-col justify-between py-10 px-6 shrink-0">
        <div className="flex flex-col items-center w-full space-y-4">
          <Skeleton className="w-36 h-36 rounded-full" />
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
          <div className="w-full border-t border-border/60 my-4" />
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div className="w-full flex flex-col items-center space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </aside>

      {/* Right Content Area Skeleton */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-card/20 p-6 md:p-8 space-y-6">
        {/* Navigation Tabs Bar Skeleton */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-5 flex-1">
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full rounded-lg" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
}

interface OnlineAdmissionSkeletonProps extends SkeletonLayoutProps {
  title?: string;
  processName?: string;
}

export function OnlineAdmissionSkeleton({
  title = "BASIC EDUCATION EARLY REGISTRATION FORM",
  processName = "Early Registration",
  className,
}: OnlineAdmissionSkeletonProps) {
  const { schoolName, logoUrl } = useSettingsStore();
  if (isLoggingOut()) return null;

  return (
    <div className={cn("relative min-h-screen flex flex-col w-full bg-background selection:bg-primary selection:text-white", className)}>
      {/* 1. Exact Fixed Pixel Grid Background + Glow */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: "hsl(var(--sidebar-background)/0.5)",
        }}>
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="pixel-grid-online-admission"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse">
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="2"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pixel-grid-online-admission)" />
        </svg>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, hsl(var(--primary)/0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. Exact AdmissionHeader */}
      <AdmissionHeader
        logoUrl={logoUrl}
        schoolName={schoolName}
        title={title}
      />

      {/* 3. Privacy Notice Card Container */}
      <main className="px-4 sm:px-6 lg:px-8 flex flex-col flex-1 py-8">
        <div className="w-full mx-auto flex flex-col max-w-4xl flex-1">
          <div className="mx-auto p-4 md:p-8 w-full">
            <div className="shadow-lg border border-border rounded-lg overflow-hidden bg-card">
              {/* Card Header with Shield Icon */}
              <div className="bg-muted/30 border-b border-border pb-6 pt-6 px-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 mx-auto text-primary">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    Data Privacy Notice
                  </h2>
                  <p className="text-base text-foreground font-bold">
                    Republic Act No. 10173
                  </p>
                </div>
              </div>

              {/* Card Content with scrollable notice */}
              <div className="pt-6 px-6 md:px-10">
                <div className="space-y-4 text-base leading-relaxed">
                  <div className="max-h-160 overflow-hidden border border-border rounded-xl p-5 bg-muted/5 space-y-5">
                    {/* Notice School Header */}
                    <div className="space-y-2">
                      <div className="h-5 w-80 rounded bg-muted-foreground/20 font-bold" />
                      <div className="space-y-1.5 pt-1">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-11/12 rounded" />
                        <Skeleton className="h-4 w-4/5 rounded" />
                      </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* Why we collect Section */}
                    <div className="space-y-3">
                      <div className="h-4 w-56 rounded bg-muted-foreground/20 font-bold" />
                      <div className="space-y-2.5 pl-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                            <Skeleton className="h-3.5 w-full rounded" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-border/60" />

                    {/* What information Section */}
                    <div className="space-y-3">
                      <div className="h-4 w-52 rounded bg-muted-foreground/20 font-bold" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Read indicator */}
                  <div className="flex items-center justify-center gap-2 py-1">
                    <Skeleton className="h-4 w-56 rounded" />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex flex-col items-stretch gap-6 bg-muted/30 border-t border-border p-6 md:p-10">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded mt-0.5 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 rounded-md bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold uppercase text-primary/60">
                    Continue to {processName} Form
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function OnlineTrackStatusSkeleton({
  title = "TRACK APPLICATION STATUS",
  className,
}: {
  title?: string;
  className?: string;
}) {
  const { schoolName, logoUrl } = useSettingsStore();
  if (isLoggingOut()) return null;

  return (
    <div className={cn("relative min-h-screen flex flex-col w-full bg-background selection:bg-primary selection:text-white", className)}>
      {/* 1. Exact Fixed Pixel Grid Background + Glow */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: "hsl(var(--sidebar-background)/0.5)",
        }}>
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="pixel-grid-track-skeleton"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse">
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="2"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="2"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
              <rect
                x="42"
                y="42"
                width="36"
                height="36"
                rx="2"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pixel-grid-track-skeleton)" />
        </svg>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, hsl(var(--primary)/0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. Exact AdmissionHeader */}
      <AdmissionHeader
        logoUrl={logoUrl}
        schoolName={schoolName}
        title={title}
      />

      {/* 3. Main Track Card */}
      <main className="flex-1 flex flex-col justify-center py-8">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
          <div className="h-10 w-48 rounded-md mb-6 bg-emerald-600/20 flex items-center px-4 gap-2">
            <ArrowLeft className="w-4 h-4 text-emerald-700/60" />
            <Skeleton className="h-4 w-32 rounded bg-emerald-600/30" />
          </div>
          <div className="w-full overflow-hidden rounded-lg border-2 border-emerald-100 shadow-xl bg-card">
            <div className="bg-emerald-600/90 p-8 text-center text-white space-y-2">
              <h2 className="text-2xl font-bold uppercase">{title}</h2>
              <p className="text-sm font-bold text-white/80">
                Enter the tracking number issued after submitting your admission or enrollment form.
              </p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-14 w-full rounded-md border-2 border-emerald-600/20" />
              </div>
              <div className="h-14 w-full rounded-md bg-emerald-600/80 flex items-center justify-center">
                <span className="text-lg font-bold uppercase text-white">Check Status</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function EnrollmentFormSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return <OnlineAdmissionSkeleton className={className} />;
}

export function DashboardSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex min-h-0 min-w-0 w-full flex-1 flex-col gap-4 pb-6", className)}>
      {/* 1. Exact DashboardPhaseBanner */}
      <div className="rounded-2xl bg-primary/80 p-6 shadow-md flex flex-col gap-6 relative overflow-hidden mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg bg-primary-foreground/20" />
            <Skeleton className="h-4 w-96 rounded bg-primary-foreground/20" />
          </div>
        </div>
        {/* DashboardSummaryRibbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-primary-foreground/10 space-y-2">
              <Skeleton className="h-3 w-20 rounded bg-primary-foreground/20" />
              <Skeleton className="h-6 w-16 rounded bg-primary-foreground/30" />
              <Skeleton className="h-2.5 w-28 rounded bg-primary-foreground/15" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. DashboardActionToolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg border border-border bg-card p-2 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Operational Queue Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* 4. Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-10 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeachersDirectorySkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex flex-col min-w-0 w-full max-w-full overflow-hidden h-[calc(100vh-6rem)] gap-4", className)}>
      <div className="flex-1 min-h-0 bg-muted border border-border shadow-sm flex flex-col overflow-hidden rounded-md">
        {/* Dedicated Workspace Toolbar */}
        <div className="flex flex-row items-center justify-end p-3 gap-2 bg-transparent border-b border-border shrink-0">
          <Skeleton className="h-9 w-36 rounded-sm" />
          <Skeleton className="h-9 w-36 rounded-sm" />
        </div>

        {/* Inline Metric Toolbar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 h-auto min-h-10 border-b border-border bg-card shrink-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 md:py-0 h-10 md:h-12">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          ))}
        </div>

        {/* Search & Filter bar */}
        <div className="p-3 flex flex-wrap gap-2 items-center justify-between bg-card border-b border-border shrink-0">
          <Skeleton className="h-9 w-64 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* Table rows */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="divide-y divide-border/60 overflow-hidden flex-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 w-48">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentsMasterlistSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex flex-col min-w-0 w-full max-w-full overflow-hidden h-[calc(100vh-6rem)]", className)}>
      {/* 4 Tabs: Active, Unassigned, Transferred, Dropped */}
      <div className="w-full flex flex-wrap sm:flex-nowrap h-auto gap-1 mb-4 p-1 bg-muted border border-border rounded-xl relative shadow-sm shrink-0">
        <div className="flex-1 py-2 px-3 rounded-lg bg-primary/20 flex items-center justify-center">
          <Skeleton className="h-4 w-28 rounded bg-primary/30" />
        </div>
        <div className="flex-1 py-2 px-3 rounded-lg flex items-center justify-center">
          <Skeleton className="h-4 w-36 rounded" />
        </div>
        <div className="flex-1 py-2 px-3 rounded-lg flex items-center justify-center">
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="flex-1 py-2 px-3 rounded-lg flex items-center justify-center">
          <Skeleton className="h-4 w-28 rounded" />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <Skeleton className="h-9 w-64 rounded-md" />
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="divide-y divide-border/60 overflow-hidden flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex items-center gap-3 w-48">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 shrink-0">
          <Skeleton className="h-4 w-40 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EarlyRegistrationSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex flex-1 h-full w-full min-h-0 flex-col", className)}>
      {/* 2 Tabs: Incoming Grade 7, Grades 8-10 */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 h-auto gap-1 mb-4 p-1 bg-muted border border-border rounded-md relative shadow-sm shrink-0">
        <div className="w-full py-2 px-3 rounded-md bg-primary/20 flex items-center justify-center">
          <Skeleton className="h-4 w-36 rounded bg-primary/30" />
        </div>
        <div className="w-full py-2 px-3 rounded-md flex items-center justify-center">
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden shadow-xs flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="divide-y divide-border/60 overflow-hidden flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex items-center gap-3 w-48">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 shrink-0">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogsSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("space-y-3.5 flex flex-col min-h-0 flex-1", className)}>
      {/* Search Filters Card */}
      <div className="border border-border/80 shadow-xs bg-card rounded-xl p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="border border-border/80 shadow-xs bg-card rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <div className="divide-y divide-border/60 overflow-hidden flex-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-3.5 w-28 rounded" />
              <div className="flex items-center gap-2 w-28">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-18 rounded-full" />
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>
          ))}
        </div>
        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 shrink-0">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegistrySkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return <StudentsMasterlistSkeleton className={className} />;
}

interface SettingsSkeletonProps extends SkeletonLayoutProps {
  hideTabs?: boolean;
}

export function SettingsSkeleton({ className, hideTabs = false }: SettingsSkeletonProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-1 h-full w-full min-h-0 flex-col space-y-6",
        className,
      )}
    >
      {/* 1. Exact 2-Tab Segmented Bar */}
      {!hideTabs && (
        <div className="w-full flex flex-col sm:flex-row h-auto gap-1 mb-4 p-1 bg-muted border border-border rounded-xl relative shadow-sm">
          <div className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-primary/20 flex items-center justify-center">
            <Skeleton className="h-5 w-32 rounded bg-primary/30" />
          </div>
          <div className="w-full sm:flex-1 py-2 px-3 rounded-lg flex items-center justify-center">
            <Skeleton className="h-5 w-48 rounded" />
          </div>
        </div>
      )}

      <div className="space-y-8 min-w-0">
        {/* 2. School Identity Card */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <Skeleton className="h-6 w-36 rounded" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Special Curricular Program (SCP) Configuration Card */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <Skeleton className="h-6 w-72 rounded" />
            </div>
          </div>
          <div className="p-6 pt-0 space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-12 rounded" />
                      <Skeleton className="h-3 w-36 rounded" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Official Communication Channels & Branding Card */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <Skeleton className="h-6 w-80 rounded" />
            </div>
          </div>
          <div className="p-6 pt-0 space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className="h-px bg-border my-6" />
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-3">
                <Skeleton className="h-5 w-40 rounded" />
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
                  <div className="space-y-3 flex-1 w-full">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-4 w-52 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BOSYSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div
      className={cn(
        "flex flex-1 h-full w-full min-h-0 flex-col space-y-4",
        className,
      )}
    >
      {/* 1. Exact 2-Tab Segmented Bar */}
      <div className="w-full h-auto gap-1 mb-2 p-1 bg-muted border border-border rounded-md grid grid-cols-1 sm:grid-cols-2">
        <div className="w-full py-2 px-3 rounded-md bg-primary/20 flex items-center justify-center">
          <Skeleton className="h-5 w-44 rounded bg-primary/30" />
        </div>
        <div className="w-full py-2 px-3 rounded-md flex items-center justify-center">
          <Skeleton className="h-5 w-40 rounded" />
        </div>
      </div>
      {/* 2. Grade selector pills */}
      <div className="flex items-center gap-2 pb-1">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      {/* 3. Toolbar & Table */}
      <ToolbarSkeleton controls={3} />
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  );
}

export function SystemHealthSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("space-y-6 w-full flex-1", className)}>
      {/* Header with Title description + Refresh button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-80 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* 3 Status Cards in grid-cols-1 md:grid-cols-2 xl:grid-cols-3 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
            <div className="pt-1 space-y-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Detail Cards in grid-cols-1 xl:grid-cols-2 */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Record Counts Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-4 w-60 rounded" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/40">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Details Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <Skeleton className="h-6 w-36 rounded" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Errors Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
    </div>
  );
}

export function AdvisoryClassSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex flex-col h-full min-h-0 space-y-6 w-full flex-1", className)}>
      <div className="rounded-xl border border-border bg-card flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-9 w-44 rounded-md" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>

        {/* Sub Header & Controls */}
        <div className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <Skeleton className="h-6 w-52 rounded mb-1" />
          <Skeleton className="h-4 w-80 rounded mb-4" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-10 w-full sm:w-72 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Table rows */}
        <div className="p-6 flex-1 flex flex-col min-h-0">
          <div className="flex-1 rounded-md border border-border overflow-hidden">
            <div className="p-3 bg-muted/40 border-b border-border flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="divide-y divide-border/60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3.5 flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RosterSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("space-y-6 w-full flex-1 flex flex-col min-h-0", className)}>
      <Skeleton className="h-5 w-40 rounded" />
      <div className="rounded-xl border border-border bg-card flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52 rounded" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col min-h-0">
          <ToolbarSkeleton controls={2} className="mb-4" />
          <DataTableSkeleton rows={8} columns={5} />
        </div>
      </div>
    </div>
  );
}

export function PersonnelProfileSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3 w-full", className)}>
      <Skeleton className="h-9 w-48 rounded-md" />
      <div className="min-h-0 flex-1 rounded-md border border-border bg-background p-4 sm:p-6 space-y-6 overflow-hidden">
        {/* Summary Card */}
        <div className="bg-muted/40 p-6 rounded-md border border-border flex items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-7 w-64 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* Section Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-md border border-border bg-card space-y-4">
            <Skeleton className="h-5 w-40 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
          <div className="p-5 rounded-md border border-border bg-card space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("w-full space-y-5 flex-1", className)}>
      <div className="border-b border-border pb-5 space-y-2">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
              </div>
            </div>
            <div className="pt-3 border-t border-border space-y-2.5">
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <Skeleton className="h-9 w-36 rounded-md pt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EosySkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col w-full space-y-4", className)}>
      {/* Grade Tabs Row + Button */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex-1 flex gap-1 p-1 bg-muted border border-border rounded-xl">
          {["Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((g, i) => (
            <div key={g} className={cn("flex-1 py-2 px-3 rounded-lg flex items-center justify-center", i === 0 && "bg-primary/20")}>
              <Skeleton className={cn("h-5 w-20 rounded", i === 0 && "bg-primary/30")} />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-48 rounded-xl shrink-0" />
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-border rounded-md shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-border flex flex-col sm:flex-row justify-between gap-3">
          <Skeleton className="h-10 w-full sm:w-80 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <DataTableSkeleton rows={10} columns={5} />
        </div>
      </div>
    </div>
  );
}

export function LearnerAdmissionSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex h-full min-h-0 w-full flex-1 flex-col space-y-4", className)}>
      {/* Program Tabs */}
      <div className="flex gap-1 p-1 bg-muted border border-border rounded-xl w-full">
        {["Science, Tech & Eng (STE)", "Arts (SPA)", "Sports (SPS)"].map((p, i) => (
          <div key={p} className={cn("flex-1 py-2 px-3 rounded-lg flex items-center justify-center", i === 0 && "bg-primary/20")}>
            <Skeleton className={cn("h-5 w-36 rounded", i === 0 && "bg-primary/30")} />
          </div>
        ))}
      </div>

      {/* Banner / Stat summary */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-5 w-60 rounded" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Toolbar & Table */}
      <ToolbarSkeleton controls={3} />
      <DataTableSkeleton rows={8} columns={5} />
    </div>
  );
}

export function HomeroomsSkeleton({ className }: SkeletonLayoutProps) {
  if (isLoggingOut()) return null;
  return (
    <div className={cn("flex flex-1 h-full w-full min-h-0 flex-col space-y-4", className)}>
      {/* Grade Level Tabs */}
      <div className="w-full flex gap-1 p-1 bg-muted border border-border rounded-xl">
        {["Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((g, i) => (
          <div key={g} className={cn("flex-1 py-2 px-3 rounded-lg flex items-center justify-center", i === 0 && "bg-primary/20")}>
            <Skeleton className={cn("h-5 w-24 rounded", i === 0 && "bg-primary/30")} />
          </div>
        ))}
      </div>

      {/* Main Grade Container */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 flex-1">
        <Skeleton className="h-7 w-32 rounded" />
        
        {/* Category: SCP */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-28 rounded" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Category: Regular BEC */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-28 rounded" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Universal PageLoadingSkeleton that dispatches to the high-fidelity skeleton
 * matching the given page layout variant.
 */
export function PageLoadingSkeleton({
  className,
  variant = "generic",
}: PageLoadingSkeletonProps) {
  if (isLoggingOut()) {
    return null;
  }
  if (variant === "dashboard") {
    return <DashboardSkeleton className={className} />;
  }
  if (variant === "registry") {
    return <RegistrySkeleton className={className} />;
  }
  if (variant === "systemHealth") {
    return <SystemHealthSkeleton className={className} />;
  }
  if (variant === "advisory") {
    return <AdvisoryClassSkeleton className={className} />;
  }
  if (variant === "roster") {
    return <RosterSkeleton className={className} />;
  }
  if (variant === "personnelProfile") {
    return <PersonnelProfileSkeleton className={className} />;
  }
  if (variant === "help") {
    return <HelpSkeleton className={className} />;
  }
  if (variant === "eosy") {
    return <EosySkeleton className={className} />;
  }
  if (variant === "learnerAdmission") {
    return <LearnerAdmissionSkeleton className={className} />;
  }
  if (variant === "homerooms") {
    return <HomeroomsSkeleton className={className} />;
  }
  if (variant === "twoPanel") {
    return (
      <div className={cn("w-full flex-1 flex flex-col min-h-0", className)}>
        <TwoPanelSkeleton />
      </div>
    );
  }
  if (variant === "cardGrid") {
    return (
      <div className={cn("space-y-6 w-full flex-1", className)}>
        <SkeletonPageHeader />
        <ToolbarSkeleton controls={3} />
        <CardGridSkeleton count={8} />
      </div>
    );
  }
  if (variant === "settings") {
    return <SettingsSkeleton className={className} />;
  }
  if (variant === "earlyRegistrationOnline") {
    return (
      <OnlineAdmissionSkeleton
        title="BASIC EDUCATION EARLY REGISTRATION FORM"
        processName="Early Registration"
        className={className}
      />
    );
  }
  if (variant === "enrollmentOnline") {
    return (
      <OnlineAdmissionSkeleton
        title="ONLINE ENROLLMENT FORM"
        processName="Enrollment"
        className={className}
      />
    );
  }
  if (variant === "scpAdmissionOnline") {
    return (
      <OnlineAdmissionSkeleton
        title="SPECIAL CURRICULAR PROGRAM ADMISSION FORM"
        processName="Admission"
        className={className}
      />
    );
  }
  if (variant === "trackApplicationOnline") {
    return (
      <OnlineTrackStatusSkeleton
        title="TRACK APPLICATION STATUS"
        className={className}
      />
    );
  }
  if (variant === "monitorOnline") {
    return (
      <OnlineTrackStatusSkeleton
        title="MONITOR PORTAL"
        className={className}
      />
    );
  }
  if (variant === "onlineAdmission" || variant === "enrollmentForm") {
    return <OnlineAdmissionSkeleton className={className} />;
  }
  if (variant === "onlineTrackStatus") {
    return <OnlineTrackStatusSkeleton className={className} />;
  }
  if (variant === "form") {
    return <FormSkeleton sections={3} className={className} />;
  }
  if (variant === "learnerProfile") {
    return <LearnerProfileSkeleton className={className} />;
  }
  if (variant === "bosy") {
    return <BOSYSkeleton className={className} />;
  }
  if (variant === "teachersDirectory") {
    return <TeachersDirectorySkeleton className={className} />;
  }
  if (variant === "studentsMasterlist") {
    return <StudentsMasterlistSkeleton className={className} />;
  }
  if (variant === "earlyRegistration") {
    return <EarlyRegistrationSkeleton className={className} />;
  }
  if (variant === "auditLogs") {
    return <AuditLogsSkeleton className={className} />;
  }

  // Clean Neutral Content Fallback (No fake header or placeholder buttons)
  return (
    <div className={cn("w-full flex-1 flex flex-col min-h-0 space-y-4", className)}>
      <div className="flex-1 w-full rounded-xl border border-border bg-card/60 p-6 space-y-4 shadow-sm min-h-[300px]">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3.5 w-72 rounded" />
        </div>
        <div className="space-y-3 pt-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
