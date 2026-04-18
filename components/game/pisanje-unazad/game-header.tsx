"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Sticky top bar required by every SafeGate game (design.md §4A).
 *
 *   [ TITLE ]          [ COUNTDOWN ]          [ PROGRESS DOTS ]
 *
 * Countdown pulses when < 3s remain.
 */
export interface GameHeaderProps {
  title: string;
  subtitle?: string;
  /** 0..N — current timer value in seconds. Null = hide timer */
  secondsLeft: number | null;
  /** Phase index 0..(steps-1) */
  stepIndex: number;
  steps: number;
}

export function GameHeader({
  title,
  subtitle,
  secondsLeft,
  stepIndex,
  steps,
}: GameHeaderProps) {
  const urgent = secondsLeft !== null && secondsLeft <= 3 && secondsLeft > 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "border-b border-slate-800/80 bg-background/80 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Left — game identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-2 w-2 rounded-full bg-primary shadow-glow"
            aria-hidden
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.18em] text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[10px] uppercase tracking-widest text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center — countdown timer */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
          {secondsLeft !== null ? (
            <motion.div
              key={secondsLeft}
              initial={{ scale: urgent ? 0.8 : 0.95, opacity: 0 }}
              animate={{
                scale: urgent ? [1, 1.12, 1] : 1,
                opacity: 1,
              }}
              transition={{
                duration: urgent ? 0.35 : 0.2,
                type: urgent ? "tween" : "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                urgent ? "text-warning" : "text-slate-50",
              )}
              aria-live="polite"
            >
              {secondsLeft.toString().padStart(2, "0")}
              <span className="ml-0.5 text-xs text-slate-500">s</span>
            </motion.div>
          ) : (
            <div
              className="h-2 w-2 rounded-full bg-slate-700"
              aria-hidden
            />
          )}
        </div>

        {/* Right — progress dots */}
        <div
          className="flex items-center gap-1.5"
          role="list"
          aria-label={`Step ${stepIndex + 1} of ${steps}`}
        >
          {Array.from({ length: steps }).map((_, i) => {
            const completed = i < stepIndex;
            const current = i === stepIndex;
            return (
              <span
                key={i}
                role="listitem"
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  current
                    ? "w-6 bg-primary shadow-glow"
                    : completed
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-slate-700",
                )}
                aria-current={current ? "step" : undefined}
              />
            );
          })}
        </div>
      </div>
    </header>
  );
}
