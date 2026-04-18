"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MemorizePhaseProps {
  word: string;
  /** seconds to show the word */
  durationSec?: number;
  onComplete: () => void;
}

export function MemorizePhase({
  word,
  durationSec = 3,
  onComplete,
}: MemorizePhaseProps) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Memorize the word
      </p>

      {/* Word display — oversized monospace with scan line */}
      <div className="relative mb-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/40 bg-surface shadow-glow">
        {/* Scan line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 animate-scan bg-gradient-to-b from-primary/30 to-transparent" />

        {/* Corner brackets for diagnostic feel */}
        <CornerBracket className="left-2 top-2" />
        <CornerBracket className="right-2 top-2 rotate-90" />
        <CornerBracket className="left-2 bottom-2 -rotate-90" />
        <CornerBracket className="right-2 bottom-2 rotate-180" />

        <div className="flex items-center justify-center px-6 py-16 sm:py-20">
          <motion.div
            key={word}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex gap-1 sm:gap-2"
          >
            {word.split("").map((char, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
                className="inline-flex h-14 w-10 items-center justify-center font-mono text-4xl font-bold text-slate-50 sm:h-20 sm:w-14 sm:text-6xl"
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Countdown bar */}
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-slate-500">
          <span>Disappears in</span>
          <span className="tabular-nums text-slate-300">
            {remaining.toString().padStart(2, "0")}s
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            key={word}
            className="h-full bg-primary shadow-glow"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: durationSec, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function CornerBracket({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-4 w-4 border-l-2 border-t-2 border-primary/60 ${className}`}
      aria-hidden
    />
  );
}
