import depedLogo from "@/assets/DepEd-logo.png";
import bagongPilipinasLogo from "@/assets/bagong-pilipinas.png";
import educationSvg from "@/assets/Department_of_Education.svg";
import { Search } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/shared/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

interface AdmissionHeaderProps {
  isClosed?: boolean;
  logoUrl?: string | null;
  schoolName?: string;
  title: React.ReactNode;
}

export default function AdmissionHeader({
  isClosed,
  logoUrl,
  schoolName,
  title,
}: AdmissionHeaderProps) {
  const location = useLocation();
  const isMonitorPage = location.pathname === "/monitor";

  if (isClosed) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-auto py-4 sm:min-h-25 grid grid-cols-[15%_70%_15%] md:grid-cols-[22%_50%_28%] lg:grid-cols-3 items-center gap-1 sm:gap-6 relative">
        {/* 1. School Logo (Mobile) / Logo + Education SVG (Desktop) */}
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 overflow-hidden">
          {logoUrl ? (
            <img
              src={`${API_BASE}${logoUrl}`}
              alt={`${schoolName || "School"} logo`}
              className="h-10 w-10 sm:h-16 sm:w-16 max-w-full object-contain"
            />
          ) : (
            <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 rounded-full bg-[hsl(var(--primary))/0.1] flex items-center justify-center">
              <span className="text-base sm:text-xl font-bold text-foreground">
                {schoolName?.charAt(0) || ""}
              </span>
            </div>
          )}

          {/* Education SVG beside school logo on Desktop */}
          <img
            src={educationSvg}
            alt="Department of Education"
            className="hidden sm:block h-10 w-10 sm:h-16 sm:w-16 max-w-full object-contain"
          />
        </div>

        {/* 2. School Name & Title (Centered) */}
        <div className="flex flex-col items-center justify-center text-center min-w-0">
          <span className="text-[0.8rem] sm:text-lg md:text-xl font-black tracking-tight text-foreground leading-none uppercase wrap-break-word">
            {schoolName}
          </span>
          <span className="text-[0.565rem] sm:text-[0.625rem] md:text-xs font-black tracking-widest sm:tracking-[0.15em] uppercase text-foreground mt-0.5 sm:mt-1 wrap-break-word">
            {title}
          </span>
        </div>

        {/* 3. Education SVG (Mobile) / DepEd + Bagong Pilipinas Logo (Desktop) + Monitor Link */}
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 overflow-hidden">
          {/* Education SVG only on mobile in this column */}
          <img
            src={educationSvg}
            alt="Department of Education"
            className="block sm:hidden h-10 w-10 max-w-full object-contain"
          />

          {/* DepEd and Bagong Pilipinas Logos only on desktop in this column */}
          <img
            src={depedLogo}
            alt="DepEd logo"
            className="hidden sm:block h-10 w-10 sm:h-16 sm:w-30 max-w-full object-contain"
          />
          <img
            src={bagongPilipinasLogo}
            alt="Bagong Pilipinas logo"
            className="hidden sm:block h-10 w-10 sm:h-20 sm:w-20 max-w-full object-contain"
          />
        </div>

        {/* Monitor Floating Link for Applicants */}
        {!isMonitorPage && (
          <Link
            to="/monitor"
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20",
              "text-[0.625rem] font-black uppercase tracking-widest",
            )}>
            <Search className="w-3.5 h-3.5" />
            Monitor Application
          </Link>
        )}
      </div>
    </header>
  );
}

