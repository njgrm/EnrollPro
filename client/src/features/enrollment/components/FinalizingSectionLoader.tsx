import { useId } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import {
  createMotionTransition,
  getReducedMotionProps,
  useMotionPreferences,
} from "@/shared/lib/motion";

export interface FinalizingSectionLoaderProps {
  currentSection: string | null;
  completedSections: number;
  totalSections: number;
  isComplete?: boolean;
}

export function FinalizingSectionLoader({
  currentSection,
  completedSections,
  totalSections,
  isComplete = false,
}: FinalizingSectionLoaderProps) {
  const motionPreferences = useMotionPreferences();
  const patternId = useId().replace(/:/g, "");
  const progress = isComplete
    ? 100
    : Math.min(
        100,
        (completedSections / Math.max(totalSections, 1)) * 100,
      );

  const dotTransition = {
    duration: motionPreferences.durations.slow,
    repeat: motionPreferences.reduceMotion ? 0 : Infinity,
    ease: "easeInOut",
  } as const;

  return (
    <motion.div
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }}
      transition={createMotionTransition(motionPreferences, "normal")}
      {...getReducedMotionProps(motionPreferences.reduceMotion)}
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/90 px-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Finalizing official sections"
    >
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <svg
          aria-hidden="true"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id={`finalizing-section-loader-${patternId}`}
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="4"
                fill="none"
                stroke="hsl(var(--primary) / 0.10)"
                strokeWidth="1"
              />
              <rect
                x="42"
                y="42"
                width="36"
                height="36"
                rx="4"
                fill="none"
                stroke="hsl(var(--primary) / 0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#finalizing-section-loader-${patternId})`} />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-lg border border-primary/20 bg-card px-8 py-12 text-center shadow-xl">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-5 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </motion.div>
        ) : (
          <div className="mb-5 flex h-4 items-center justify-center gap-2.5">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-3 w-3 rounded-full bg-primary"
                animate={{ y: motionPreferences.reduceMotion ? 0 : [0, -8, 0] }}
                transition={{ ...dotTransition, delay: index * 0.12 }}
              />
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-foreground">
          {isComplete ? "Sections Finalized" : "Finalizing Official Sections"}
        </h2>
        <p className="mt-1 text-sm font-bold text-foreground">
          {isComplete
            ? "Official section assignments saved successfully."
            : currentSection
            ? `FINALIZING SECTION: ${currentSection}`
            : "Finishing official section assignments."}
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={createMotionTransition(motionPreferences, "normal")}
          />
        </div>
        <p className="mt-3 text-sm font-bold text-foreground">
          {isComplete ? totalSections : completedSections} of {totalSections} sections processed
        </p>
      </div>
    </motion.div>
  );
}
