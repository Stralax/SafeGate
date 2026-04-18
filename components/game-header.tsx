"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface GameHeaderProps {
  title: string;
  /** Seconds remaining — pulses red when ≤ 3s (design.md §4A). */
  secondsLeft?: number;
  /** Progress indicator, e.g. { current: 1, total: 3 }. */
  progress?: { current: number; total: number };
}

export function GameHeader({ title, secondsLeft, progress }: GameHeaderProps) {
  const urgent = secondsLeft !== undefined && secondsLeft <= 3;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-safegate-bg/90 px-6 backdrop-blur">
      <h1 className="text-lg font-bold tracking-tight text-slate-50">{title}</h1>

      {secondsLeft !== undefined && (
        <motion.div
          key={urgent ? "urgent" : "calm"}
          animate={urgent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: urgent ? Infinity : 0 }}
          className={cn(
            "font-mono text-xl font-bold tabular-nums",
            urgent ? "text-safegate-danger" : "text-safegate-primary",
          )}
        >
          {secondsLeft.toString().padStart(2, "0")}s
        </motion.div>
      )}

      {progress && (
        <div className="flex items-center gap-2">
          {Array.from({ length: progress.total }).map((_, i) => {
            const active = i < progress.current;
            return (
              <span
                key={i}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  active ? "bg-safegate-primary shadow-glow" : "bg-slate-700",
                )}
              />
            );
          })}
        </div>
      )}
    </header>
  );
}
