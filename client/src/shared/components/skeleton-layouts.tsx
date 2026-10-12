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
  | "learnerProfile";

interface SkeletonLayoutProps {
  className?: string;
}

interface PageLoadingSkeletonProps extends SkeletonLayoutProps {
  withDelay?: boolean;
  variant?: SkeletonPageVariant;
}

export function PageLoadingSkeleton({
  className,
  variant = "generic",
}: PageLoadingSkeletonProps) {
  if (variant === "learnerProfile") {
    return <LearnerProfileSkeleton className={className} />;
  }
  return null;
}

export function SkeletonPageHeader({ className: _c }: SkeletonLayoutProps) {
  return null;
}

export function MetricCardSkeleton() {
  return null;
}

export function ToolbarSkeleton({ controls: _ctrls = 3 }: { controls?: number }) {
  return null;
}

export function DataTableSkeleton({
  rows: _r = 50,
  columns: _c = 5,
  dense: _d = false,
  className: _cls,
}: {
  rows?: number;
  columns?: number;
  dense?: boolean;
  className?: string;
}) {
  return null;
}

export function CardGridSkeleton({ count: _c = 6, className: _cls }: { count?: number; className?: string }) {
  return null;
}

export function FormSkeleton({ sections: _s = 3, className: _cls }: { sections?: number; className?: string }) {
  return null;
}

export function TwoPanelSkeleton({ className: _c }: SkeletonLayoutProps) {
  return null;
}

export function DetailPanelSkeleton({ className: _c }: SkeletonLayoutProps) {
  return null;
}

export function ModalBodySkeleton({ className: _c }: SkeletonLayoutProps) {
  return null;
}

export function LearnerProfileSkeleton({ className }: SkeletonLayoutProps) {
  return (
    <div className={cn("flex flex-col md:flex-row w-full h-full min-h-[calc(100vh-56px)] overflow-hidden bg-background", className)}>
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

export function EnrollmentFormSkeleton() {
  return null;
}
