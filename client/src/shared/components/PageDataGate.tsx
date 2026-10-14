import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/lib/utils";

interface PageDataGateProps {
  /**
   * When true, renders the provided skeleton.
   * When false, smoothly renders the full page content with a polished fade-in.
   */
  isLoading: boolean;
  /**
   * High-fidelity skeleton matching the page layout.
   */
  skeleton: React.ReactNode;
  /**
   * Complete page content once all required queries/data have arrived.
   */
  children: React.ReactNode;
  /**
   * Optional wrapper className.
   */
  className?: string;
}

/**
 * PageDataGate ensures all essential page data is fully loaded BEFORE
 * the page renders completely, preventing partial card flashes, jumping layout shifts,
 * and piecemeal rendering.
 */
export function PageDataGate({
  isLoading,
  skeleton,
  children,
  className,
}: PageDataGateProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn("w-full h-full flex flex-col flex-1 min-h-0", className)}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={cn("w-full h-full flex flex-col flex-1 min-h-0", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageDataGate;
