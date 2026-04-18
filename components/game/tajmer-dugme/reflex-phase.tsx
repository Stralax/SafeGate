"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  isHumanlyPlausible,
  randomWaitMs,
} from "@/lib/scoringTajmerDugme";
import type { TrialResult } from "@/lib/typesTajmerDugme";

interface ReflexPhaseProps {
  totalTrials: number;
  /** ms after green appears before auto-timeout of trial */
  trialTimeoutMs?: number;
  onTrialsComplete: (results: TrialResult[]) => void;
  /** Emitted on each trial completion so the parent can update the header step */
  onTrialStart?: (index: number) => void;
}

/** Internal per-trial state machine */
type TrialPhase =
  | "waiting"    // Red — user must wait
  | "ready"      // Green — user must click
  | "captured"   // Valid click — showing result briefly
  | "false"      // False start — clicked while red
  | "missed";    // Timed out without clicking green

export function ReflexPhase({
  totalTrials,
  trialTimeoutMs = 3000,
  onTrialsComplete,
  onTrialStart,
}: ReflexPhaseProps) {
  const [results, setResults] = useState<TrialResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<TrialPhase>("waiting");
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Source-of-truth for accumulated trials. We also keep `results` state
  // for rendering, but all timer-driven logic reads from the ref to avoid
  // stale closures.
  const resultsRef = useRef<TrialResult[]>([]);

  // Timing refs — held in refs (not state) to avoid unnecessary re-renders
  const currentWaitMs = useRef<number>(0);
  const greenShownAt = useRef<number | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ───────── Trial lifecycle ───────── */

  const clearAllTimers = () => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    waitTimer.current = null;
    timeoutTimer.current = null;
    advanceTimer.current = null;
  };

  const startTrial = useCallback((idx: number) => {
    clearAllTimers();
    const wait = randomWaitMs();
    currentWaitMs.current = wait;
    greenShownAt.current = null;
    setPhase("waiting");
    onTrialStart?.(idx);

    // Schedule the red → green transition
    waitTimer.current = setTimeout(() => {
      greenShownAt.current = performance.now();
      setPhase("ready");

      // And the trial-timeout if user never clicks
      timeoutTimer.current = setTimeout(() => {
        finishTrial(idx, {
          index: idx,
          waitMs: wait,
          status: "timeout",
          latencyMs: null,
        });
      }, trialTimeoutMs);
    }, wait);
  }, [trialTimeoutMs, onTrialStart]);

  const finishTrial = (idx: number, result: TrialResult) => {
    clearAllTimers();
    // Append via ref — ref is read by timer callbacks, state is for render
    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);
    setLastLatencyMs(result.latencyMs);

    // Set display phase for feedback
    if (result.status === "valid") setPhase("captured");
    else if (result.status === "false-start") setPhase("false");
    else setPhase("missed");

    // After the feedback flash, advance (or finish)
    advanceTimer.current = setTimeout(() => {
      if (resultsRef.current.length >= totalTrials) {
        onTrialsComplete(resultsRef.current);
      } else {
        setCurrentIdx(idx + 1);
        startTrial(idx + 1);
      }
    }, 850);
  };

  // Kick off the first trial on mount; tear down on unmount
  useEffect(() => {
    resultsRef.current = []; // defensive reset for dev-mode double-invocation
    startTrial(0);
    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────── Click handler ───────── */

  const handleTap = () => {
    if (phase === "waiting") {
      // Clicked while red → false start
      finishTrial(currentIdx, {
        index: currentIdx,
        waitMs: currentWaitMs.current,
        status: "false-start",
        latencyMs: null,
      });
      return;
    }
    if (phase === "ready" && greenShownAt.current !== null) {
      const latencyMs = Math.round(performance.now() - greenShownAt.current);
      if (!isHumanlyPlausible(latencyMs)) {
        // Treated as a false start — suspiciously fast (< 80 ms)
        finishTrial(currentIdx, {
          index: currentIdx,
          waitMs: currentWaitMs.current,
          status: "false-start",
          latencyMs: null,
        });
        return;
      }
      finishTrial(currentIdx, {
        index: currentIdx,
        waitMs: currentWaitMs.current,
        status: "valid",
        latencyMs,
      });
    }
    // If already in captured/false/missed, ignore clicks during feedback
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      {/* Phase label */}
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Trial {currentIdx + 1} of {totalTrials}
      </p>
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
        Tap when <span className="text-success">green</span>
      </h2>

      {/* The hero reaction button */}
      <ReactionButton phase={phase} onTap={handleTap} lastLatencyMs={lastLatencyMs} />

      {/* Trial history strip */}
      <div
        className="mt-8 flex w-full max-w-md flex-wrap justify-center gap-2"
        role="list"
        aria-label="Previous trials"
      >
        {Array.from({ length: totalTrials }).map((_, i) => {
          const r = results[i];
          return <TrialPip key={i} index={i} result={r} isCurrent={i === currentIdx && !r} />;
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   The big reaction button
   ───────────────────────────────────────────── */

interface ReactionButtonProps {
  phase: TrialPhase;
  onTap: () => void;
  lastLatencyMs: number | null;
}

function ReactionButton({ phase, onTap, lastLatencyMs }: ReactionButtonProps) {
  // Color + content per phase
  const cfg = (() => {
    switch (phase) {
      case "waiting":
        return {
          bg: "bg-gradient-to-b from-rose-700 to-rose-900",
          border: "border-rose-500/40",
          shadow: "shadow-[0_0_40px_rgba(225,29,72,0.25)]",
          label: "WAIT",
          hint: "Do not tap yet…",
          pulse: true,
        };
      case "ready":
        return {
          bg: "bg-gradient-to-b from-emerald-400 to-emerald-600",
          border: "border-emerald-300",
          shadow: "shadow-[0_0_60px_rgba(16,185,129,0.5)]",
          label: "TAP!",
          hint: "Tap now",
          pulse: false,
        };
      case "captured":
        return {
          bg: "bg-gradient-to-b from-primary/30 to-primary/10",
          border: "border-primary/60",
          shadow: "shadow-glow",
          label: lastLatencyMs !== null ? `${lastLatencyMs} ms` : "—",
          hint: "Captured",
          pulse: false,
        };
      case "false":
        return {
          bg: "bg-gradient-to-b from-danger/30 to-danger/10",
          border: "border-danger/70",
          shadow: "shadow-glow-danger",
          label: "TOO EARLY",
          hint: "False start — next trial",
          pulse: false,
        };
      case "missed":
        return {
          bg: "bg-gradient-to-b from-warning/20 to-warning/5",
          border: "border-warning/60",
          shadow: "shadow-glow-warning",
          label: "MISSED",
          hint: "Timed out — next trial",
          pulse: false,
        };
    }
  })();

  return (
    <motion.button
      type="button"
      onMouseDown={onTap}
      onTouchStart={(e) => {
        e.preventDefault();
        onTap();
      }}
      aria-label={cfg.label}
      animate={cfg.pulse ? { scale: [1, 1.01, 1] } : { scale: 1 }}
      transition={
        cfg.pulse
          ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
      className={cn(
        "relative flex h-64 w-full max-w-md flex-col items-center justify-center overflow-hidden",
        "rounded-2xl border-2 transition-colors duration-75",
        "sm:h-80",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60",
        "active:scale-[0.99]",
        "select-none",
        cfg.bg,
        cfg.border,
        cfg.shadow,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.12 }}
          className="flex flex-col items-center"
        >
          <span
            className={cn(
              "font-mono text-5xl font-bold tracking-tight tabular-nums sm:text-6xl",
              phase === "ready" ? "text-emerald-950" : "text-slate-50",
            )}
          >
            {cfg.label}
          </span>
          <span
            className={cn(
              "mt-2 font-mono text-xs uppercase tracking-widest",
              phase === "ready" ? "text-emerald-900/70" : "text-slate-400",
            )}
          >
            {cfg.hint}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Corner brackets when waiting — diagnostic feel */}
      {phase === "waiting" && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-rose-400/60" />
          <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90 border-l-2 border-t-2 border-rose-400/60" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 -rotate-90 border-l-2 border-t-2 border-rose-400/60" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 rotate-180 border-l-2 border-t-2 border-rose-400/60" />
        </>
      )}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   Trial pip — small dot summary per trial
   ───────────────────────────────────────────── */

function TrialPip({
  index,
  result,
  isCurrent,
}: {
  index: number;
  result: TrialResult | undefined;
  isCurrent: boolean;
}) {
  if (!result) {
    return (
      <div
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-md border font-mono text-[10px] uppercase tracking-widest",
          isCurrent
            ? "border-primary/60 bg-primary/10 text-primary animate-pulse-ring"
            : "border-slate-800 bg-surface text-slate-600",
        )}
        role="listitem"
      >
        {(index + 1).toString().padStart(2, "0")}
      </div>
    );
  }

  if (result.status === "false-start") {
    return (
      <div
        role="listitem"
        className="flex h-8 w-14 items-center justify-center rounded-md border border-danger/60 bg-danger/10 font-mono text-[10px] font-semibold uppercase tracking-widest text-danger"
      >
        EARLY
      </div>
    );
  }
  if (result.status === "timeout") {
    return (
      <div
        role="listitem"
        className="flex h-8 w-14 items-center justify-center rounded-md border border-warning/60 bg-warning/10 font-mono text-[10px] font-semibold uppercase tracking-widest text-warning"
      >
        MISS
      </div>
    );
  }
  // Valid
  return (
    <div
      role="listitem"
      className="flex h-8 w-14 items-center justify-center rounded-md border border-success/60 bg-success/10 font-mono text-[11px] font-semibold tabular-nums text-success"
    >
      {result.latencyMs}
    </div>
  );
}
