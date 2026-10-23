import { useId } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import {
  createMotionTransition,
  getReducedMotionProps,
  useMotionPreferences,
} from "@/shared/lib/motion";

export interface BatchEnrollingLoaderProps {
  currentLearnerName?: string | null;
  currentLrn?: string | null;
  completedLearners: number;
  totalLearners: number;
  isComplete?: boolean;
}

export function BatchEnrollingLoader({
  currentLearnerName,
  currentLrn,
  completedLearners,
  totalLearners,
  isComplete = false,
}: BatchEnrollingLoaderProps) {
  const motionPreferences = useMotionPreferences();
  const patternId = useId().replace(/:/g, "");
  const progress = isComplete
    ? 100
    : Math.min(
        100,
        (completedLearners / Math.max(totalLearners, 1)) * 100,
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
      className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-background/90 px-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Enrolling selected batch continuing learners"
    >
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <svg
          aria-hidden="true"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id={`batch-enrolling-loader-${patternId}`}
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
          <rect width="100%" height="100%" fill={`url(#batch-enrolling-loader-${patternId})`} />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-primary/20 bg-card px-8 py-12 text-center shadow-2xl">
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

        <h2 className="text-lg font-extrabold text-foreground tracking-tight">
          {isComplete ? "Continuing Learners Enrolled" : "Officially Enrolling Learners"}
        </h2>

        <div className="mt-2 min-h-[2.5rem] flex flex-col items-center justify-center text-sm font-bold text-foreground">
          {isComplete ? (
            <p className="text-muted-foreground text-sm font-bold">
              Selected continuing learners have been officially enrolled for the upcoming school year.
            </p>
          ) : currentLearnerName ? (
            <div className="space-y-0.5 max-w-full truncate">
              <p className="truncate uppercase">
                <span className="text-primary font-bold mr-1.5">ENROLLING:</span>
                {currentLearnerName}
              </p>
              {currentLrn && (
                <p className="text-sm font-bold text-muted-foreground">
                  LRN: {currentLrn}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm font-bold">
              Applying official enrollment confirmations to selected learner records...
            </p>
          )}
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={createMotionTransition(motionPreferences, "normal")}
          />
        </div>

        <p className="mt-3 text-sm font-bold">
          {isComplete ? totalLearners : completedLearners} of {totalLearners} continuing learners enrolled
        </p>
      </div>
    </motion.div>
  );
}
