import { useEffect, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, CircleHelp, X } from "lucide-react";
import { useLocation } from "react-router";
import { resolvePageTitle } from "@/shared/hooks/usePageTitle";
import { useHeaderStore } from "@/store/header.slice";
import { useSettingsStore } from "@/store/settings.slice";
import { useUserManualStore } from "@/store/userManual.slice";
import { resolveUserManual, type UserManualData } from "@/shared/constants/userManuals";
import { useResizablePanel } from "@/shared/hooks/useResizablePanel";
import { Badge } from "@/shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { cn } from "@/shared/lib/utils";

/**
 * Parses basic markdown inline formatting (**bold** and `code`)
 * without bringing in heavy third-party markdown dependencies.
 */
function FormattedInlineMarkdown({ text }: { text: string }): ReactNode {
  // Regex splitting by **bold** or `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="inline-block px-1.5 py-0.5 rounded bg-muted text-primary text-xs font-mono font-semibold border border-border/60 mx-0.5 leading-none"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

/**
 * Header Icon Button Trigger for the Page User Manual.
 * Placed in the top-right utility cluster.
 */
export function PageUserManualTrigger({ className }: { className?: string }) {
  const { isOpen, toggleManual } = useUserManualStore();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleManual}
            className={cn(
              "rounded-full p-2 transition-colors cursor-pointer select-none",
              isOpen
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-primary hover:bg-primary/10",
              className,
            )}
            aria-label="Page User Manual"
            aria-expanded={isOpen}
          >
            <CircleHelp className="size-4 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Page User Manual</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Slide-out Right Sidepanel (Drawer) for the contextual User Manual.
 * Non-modal (no backdrop overlay) to allow reading instructions while
 * actively interacting with and viewing the page content.
 */
export function PageUserManualDrawer() {
  const { isOpen, closeManual } = useUserManualStore();
  const location = useLocation();
  const customHeaderTitle = useHeaderStore((s) => s.title);
  const systemPhase = useSettingsStore((s) => s.systemPhase);

  const { panelPercentage, isDesktopViewport, startResizing } = useResizablePanel(30, {
    storageKey: "page-user-manual-drawer",
    minDesktopWidth: 1024,
  });

  const currentPageTitle = useMemo(() => {
    return (
      customHeaderTitle ||
      resolvePageTitle(location.pathname, location.search) ||
      "EnrollPro"
    );
  }, [customHeaderTitle, location.pathname, location.search]);

  const manualData: UserManualData = useMemo(() => {
    return resolveUserManual(currentPageTitle, location.pathname, systemPhase);
  }, [currentPageTitle, location.pathname, systemPhase]);

  const displayTitle = manualData.pageTitle.replace(/^USER MANUAL:\s*/i, "");

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeManual();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeManual]);

  // Lock body scroll when user manual is open on mobile & tablet
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile and tablet */}
          {!isDesktopViewport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeManual}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
              aria-hidden="true"
            />
          )}
          <motion.aside
            initial={isDesktopViewport ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
            animate={isDesktopViewport ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={isDesktopViewport ? { x: "100%", opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className={cn(
              "fixed z-50 bg-background flex flex-col",
              isDesktopViewport
                ? "inset-y-0 right-0 border-l border-border shadow-[-10px_0_30px_rgba(0,0,0,0.18)] overflow-visible"
                : "inset-0 w-full h-full overflow-hidden shadow-2xl"
            )}
            style={
              isDesktopViewport
                ? {
                    width: `${panelPercentage}vw`,
                    minWidth: "320px",
                    maxWidth: "90vw",
                  }
                : undefined
            }
            role="dialog"
            aria-modal="true"
            aria-label={`User Manual: ${displayTitle}`}
          >
            {/* Left Resize Handle (Desktop Only) */}
            {isDesktopViewport && (
              <div
                onMouseDown={startResizing}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize user manual panel"
                className="absolute left-[-4px] top-0 bottom-0 w-[8px] cursor-col-resize z-50 hover:bg-primary/30 transition-colors flex items-center justify-center group rounded-l-md select-none"
              >
                <div className="h-8 w-1.5 rounded-full bg-muted-foreground/20 group-hover:bg-primary/50" />
              </div>
            )}
            {/* ─── Sticky Header ─── */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="flex size-9 sm:size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="size-4.5 sm:size-4" />
                </div>
                <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-foreground truncate">
                  User Manual: {displayTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeManual}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 text-foreground bg-muted hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                aria-label="Close user manual"
              >
                <X className="size-5 sm:size-4.5" />
              </button>
            </div>

          {/* ─── Scrollable Content Area ─── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Section A: Overview */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5"
                >
                  Section A
                </Badge>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Overview (What is this page?)
                </h3>
              </div>
              <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs transition-colors hover:border-primary/40 space-y-1.5">
                <FormattedInlineMarkdown text={manualData.overview} />
              </div>
            </section>

            {/* Section B: Key Processes */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5"
                >
                  Section B
                </Badge>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Key Processes (How to use this page)
                </h3>
              </div>

              <ul className="space-y-3">
                {manualData.keyProcesses.map((process, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-border bg-card p-3.5 shadow-xs transition-colors hover:border-primary/40 space-y-1.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5 shadow-xs">
                        {index + 1}
                      </span>
                      <div className="text-sm leading-relaxed text-foreground">
                        <FormattedInlineMarkdown text={process.replace(/^\*\*\d+\.\s*/, "**").replace(/^\d+\.\s*/, "")} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

          </div>

          {/* ─── Mobile/Tablet Sticky Dismiss Footer ─── */}
          {!isDesktopViewport && (
            <div className="p-4 border-t border-border bg-card shrink-0">
              <button
                type="button"
                onClick={closeManual}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <X className="size-4.5" />
                Close User Manual
              </button>
            </div>
          )}
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
      
  if (typeof document === "undefined") {
    return drawerContent;
  }

  return createPortal(drawerContent, document.body);
}
