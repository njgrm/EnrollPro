import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";

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
  | "bosy";

interface SkeletonLayoutProps {
  className?: string;
}

interface PageLoadingSkeletonProps extends SkeletonLayoutProps {
  withDelay?: boolean;
  variant?: SkeletonPageVariant;
}

export function SkeletonPageHeader({ className }: SkeletonLayoutProps) {
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
  return (
    <div
      className={cn(
        "space-y-6 max-w-4xl mx-auto p-6 bg-card rounded-xl border border-border shadow-sm",
        className,
      )}
    >
      <SkeletonPageHeader />
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

export function EnrollmentFormSkeleton({ className }: SkeletonLayoutProps) {
  return <FormSkeleton sections={4} className={className} />;
}

export function DashboardSkeleton({ className }: SkeletonLayoutProps) {
  return (
    <div
      className={cn(
        "space-y-6 max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1",
        className,
      )}
    >
      {/* Phase Banner Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      {/* Command center metric ribbon */}
      <MetricCardSkeleton count={4} />
      {/* Quick actions toolbar */}
      <ToolbarSkeleton controls={4} />
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-44 rounded" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <DataTableSkeleton rows={5} columns={4} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
            <Skeleton className="h-6 w-36 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegistrySkeleton({ className }: SkeletonLayoutProps) {
  return (
    <div
      className={cn(
        "space-y-5 max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1 flex flex-col min-h-0",
        className,
      )}
    >
      <SkeletonPageHeader />
      <ToolbarSkeleton controls={3} />
      <DataTableSkeleton rows={10} columns={5} />
    </div>
  );
}

export function SettingsSkeleton({ className }: SkeletonLayoutProps) {
  return (
    <div
      className={cn(
        "space-y-6 max-w-6xl mx-auto p-4 sm:p-6 w-full flex-1",
        className,
      )}
    >
      <SkeletonPageHeader />
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BOSYSkeleton({ className }: SkeletonLayoutProps) {
  return (
    <div
      className={cn(
        "space-y-6 max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1",
        className,
      )}
    >
      <SkeletonPageHeader />
      <MetricCardSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
          <Skeleton className="h-6 w-52 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-44 w-full rounded-lg" />
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
  if (variant === "dashboard") {
    return <DashboardSkeleton className={className} />;
  }
  if (variant === "registry") {
    return <RegistrySkeleton className={className} />;
  }
  if (variant === "twoPanel") {
    return (
      <div className={cn("p-4 sm:p-6 w-full flex-1 flex flex-col min-h-0", className)}>
        <TwoPanelSkeleton />
      </div>
    );
  }
  if (variant === "cardGrid") {
    return (
      <div className={cn("space-y-6 max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1", className)}>
        <SkeletonPageHeader />
        <ToolbarSkeleton controls={3} />
        <CardGridSkeleton count={8} />
      </div>
    );
  }
  if (variant === "settings") {
    return <SettingsSkeleton className={className} />;
  }
  if (variant === "form" || variant === "enrollmentForm") {
    return <FormSkeleton sections={3} className={className} />;
  }
  if (variant === "learnerProfile") {
    return <LearnerProfileSkeleton className={className} />;
  }
  if (variant === "bosy") {
    return <BOSYSkeleton className={className} />;
  }

  // Generic fallback: Header + metrics + table
  return (
    <div className={cn("space-y-6 max-w-7xl mx-auto p-4 sm:p-6 w-full flex-1", className)}>
      <SkeletonPageHeader />
      <MetricCardSkeleton count={3} />
      <DataTableSkeleton rows={8} columns={4} />
    </div>
  );
}
