"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownPhaseProps {
  onComplete: () => void;
}

/**
 * A 3-step countdown: 3 → 2 → 1 → GO, then fires onComplete.
 * Gives the user time to place hands on the buttons before physics starts.
 */
export function CountdownPhase({ onComplete }: CountdownPhaseProps) {
  const [step, setStep] = useState(3);

  useEffect(() => {
    if (step < 0) {
      onComplete();
      return;
    }
    const id = setTimeout(() => setStep((s) => s - 1), 800);
    return () => clearTimeout(id);
  }, [step, onComplete]);

  const label = step > 0 ? step.toString() : step === 0 ? "GO" : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex w-full flex-col items-center"
    >
      <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Get Ready
      </p>

      <div className="relative flex h-48 w-48 items-center justify-center">
        <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary" />
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={`font-mono text-7xl font-bold tabular-nums ${
              step === 0 ? "text-success" : "text-slate-50"
            }`}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>

      <p className="mt-8 font-mono text-xs uppercase tracking-widest text-slate-500">
        Keep the indicator in the green zone
      </p>
    </motion.div>
  );
}
