import { useState } from "react";
import depedLogo from "@/assets/DepEd-logo.png";
import GuestLayout from "@/shared/layouts/GuestLayout";
import TrackApplication from "./Track";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/lib/utils";
import { useSettingsStore } from "@/store/settings.slice";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

export default function Monitor() {
  const [monitorHasResults, setMonitorHasResults] = useState(false);
  const { schoolName, logoUrl } = useSettingsStore();

  return (
    <GuestLayout>
      <div className="relative min-h-screen flex flex-col">
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: "hsl(var(--sidebar-background)/0.5)",
          }}>
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08]"
            xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pixel-grid"
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
            <rect width="100%" height="100%" fill="url(#pixel-grid)" />
          </svg>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, hsl(var(--primary)/0.05) 0%, transparent 70%)",
            }}
          />
        </div>

        <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-auto py-4 sm:h-25 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:justify-end sm:col-start-1">
              <div className="flex shrink-0">
                {logoUrl ? (
                  <img
                    src={`${API_BASE}${logoUrl}`}
                    alt={`${schoolName} logo`}
                    className="h-12 w-12 sm:h-18 sm:w-30 shrink-0 object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-[hsl(var(--primary))/0.1] flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-foreground">
                      {schoolName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col leading-tight sm:hidden min-w-0">
                <span className="text-sm font-black tracking-tight text-foreground leading-none uppercase">
                  {schoolName}
                </span>
                <span className="text-[0.5rem] font-black tracking-widest uppercase text-muted-foreground mt-0.5">
                  Monitor Portal
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col leading-tight text-center justify-center min-w-0 sm:col-start-2">
              <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-foreground leading-none uppercase wrap-break-word">
                {schoolName}
              </span>
              <span className="text-[0.5625rem] sm:text-[0.625rem] md:text-xs font-black tracking-widest sm:tracking-[0.15em] uppercase text-muted-foreground mt-1 wrap-break-word">
                Monitor Portal
              </span>
            </div>

            <div className="hidden sm:flex justify-start overflow-hidden sm:col-start-3">
              <img
                src={depedLogo}
                alt="DepEd logo"
                className="h-14 w-14 sm:h-50 sm:w-50 shrink-0 object-contain"
              />
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 flex flex-col flex-1 py-8">
          <div className="w-full mx-auto flex flex-col max-w-6xl flex-1">
            <div
              className={cn(
                "flex flex-col",
                !monitorHasResults ? "flex-1 justify-center" : "h-auto",
              )}>
              <AnimatePresence mode="wait">
                <motion.div
                  key="monitor"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}>
                  <TrackApplication
                    onResultsFetched={setMonitorHasResults}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </GuestLayout>
  );
}
