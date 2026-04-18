"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { COLOR_META, type StroopTrial, type TrialResult, type UserAnswer } from "@/lib/typesKartice";

interface TrialPhaseProps {
  trials: StroopTrial[];
  /** ms allowed per trial before timeout */
  trialTimeoutMs?: number;
  /** ms of feedback flash between trials */
  interTrialMs?: number;
  onComplete: (results: TrialResult[]) => void;
}

/** Feedback state shown briefly between trials */
type Feedback = null | { kind: "correct" | "incorrect" | "timeout" };

export function TrialPhase({
  trials,
  trialTimeoutMs = 3000,
  interTrialMs = 600,
  onComplete,
}: TrialPhaseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [locked, setLocked] = useState(false);

  // Source-of-truth for accumulating results (avoids stale closures in timers)
  const resultsRef = useRef<TrialResult[]>([]);
  const cardShownAt = useRef<number>(0);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrial = trials[currentIdx];

  const clearAllTimers = () => {
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    timeoutTimer.current = null;
    advanceTimer.current = null;
  };

  /* ───────── Present a trial ───────── */

  const presentTrial = useCallback(
    (idx: number) => {
      clearAllTimers();
      setFeedback(null);
      setLocked(false);
      cardShownAt.current = performance.now();

      // Timeout — auto-score if the user doesn't answer in time
      timeoutTimer.current = setTimeout(() => {
        finalizeTrial(idx, {
          trial: trials[idx],
          status: "timeout",
          latencyMs: null,
          chosen: null,
        });
      }, trialTimeoutMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trialTimeoutMs, trials],
  );

  /* ───────── Finalize & advance ───────── */

  const finalizeTrial = (idx: number, result: TrialResult) => {
    if (resultsRef.current.length > idx) return; // duplicate guard
    clearAllTimers();
    setLocked(true);

    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);

    setFeedback({
      kind:
        result.status === "correct"
          ? "correct"
          : result.status === "timeout"
            ? "timeout"
            : "incorrect",
    });

    advanceTimer.current = setTimeout(() => {
      if (resultsRef.current.length >= trials.length) {
        onComplete(resultsRef.current);
      } else {
        setCurrentIdx(idx + 1);
        presentTrial(idx + 1);
      }
    }, interTrialMs);
  };

  /* ───────── Click handler ───────── */

  const handleAnswer = (chosen: UserAnswer) => {
    if (locked) return;
    const latencyMs = Math.round(performance.now() - cardShownAt.current);
    const trial = currentTrial;
    const correctAnswer: UserAnswer = trial.matches ? "yes" : "no";
    const isCorrect = chosen === correctAnswer;
    finalizeTrial(currentIdx, {
      trial,
      status: isCorrect ? "correct" : "incorrect",
      latencyMs,
      chosen,
    });
  };

  // Keyboard shortcuts — Y / ArrowLeft for yes, N / ArrowRight for no
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      if (e.key === "y" || e.key === "Y" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleAnswer("yes");
      } else if (e.key === "n" || e.key === "N" || e.key === "ArrowRight") {
        e.preventDefault();
        handleAnswer("no");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, currentIdx]);

  // Kick off the first trial on mount
  useEffect(() => {
    resultsRef.current = []; // defensive reset for dev-mode double-invocation
    presentTrial(0);
    return clearAllTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Trial {currentIdx + 1} of {trials.length}
      </p>
      <h2 className="mb-6 text-center text-lg font-semibold text-slate-300 sm:text-xl">
        Does the <span className="text-primary">color</span> match the{" "}
        <span className="text-primary">word</span>?
      </h2>

      {/* The Stroop card */}
      <StroopCard
        trial={currentTrial}
        feedback={feedback}
        timeoutMs={trialTimeoutMs}
        trialKey={currentIdx}
      />

      {/* Trial pip strip */}
      <div
        className="mt-4 mb-6 flex w-full max-w-md justify-center gap-1.5"
        role="list"
        aria-label="Trials"
      >
        {trials.map((_, i) => {
          const r = results[i];
          return <TrialPip key={i} result={r} isCurrent={i === currentIdx && !r} />;
        })}
      </div>

      {/* YES / NO buttons */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <AnswerButton
          answer="yes"
          onClick={() => handleAnswer("yes")}
          disabled={locked}
        />
        <AnswerButton
          answer="no"
          onClick={() => handleAnswer("no")}
          disabled={locked}
        />
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Keyboard: ← YES · NO →
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   The card: swatch + word
   ───────────────────────────────────────────── */

interface StroopCardProps {
  trial: StroopTrial;
  feedback: Feedback;
  timeoutMs: number;
  trialKey: number;
}

function StroopCard({ trial, feedback, timeoutMs, trialKey }: StroopCardProps) {
  const swatch = COLOR_META[trial.swatchColor];
  const wordLabel = COLOR_META[trial.wordColor].label;

  const overlayTint =
    feedback?.kind === "correct"
      ? "border-success/70 shadow-glow-success"
      : feedback?.kind === "incorrect"
        ? "border-danger/70 shadow-glow-danger"
        : feedback?.kind === "timeout"
          ? "border-warning/70 shadow-glow-warning"
          : "border-slate-800";

  return (
    <div
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-2xl border-2 bg-surface transition-colors duration-150",
        overlayTint,
      )}
    >
      {/* Corner brackets — diagnostic feel */}
      <CornerBracket className="left-3 top-3" />
      <CornerBracket className="right-3 top-3 rotate-90" />
      <CornerBracket className="left-3 bottom-3 -rotate-90" />
      <CornerBracket className="right-3 bottom-3 rotate-180" />

      {/* Content: word inside a colored square */}
      <div className="flex items-center justify-center px-6 py-10 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${trialKey}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex h-44 w-full max-w-xs items-center justify-center rounded-xl sm:h-52"
            style={{
              backgroundColor: swatch.hex,
              boxShadow: swatch.glow,
            }}
            aria-label={`Color ${swatch.label}, word ${wordLabel}`}
          >
            <span
              className="font-mono text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl"
              style={{
                // Subtle dark shadow so the word stays readable on any color
                textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              }}
            >
              {wordLabel}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback flash badge */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center"
          >
            <span
              className={cn(
                "font-mono text-xs font-bold uppercase tracking-[0.3em]",
                feedback.kind === "correct" && "text-success",
                feedback.kind === "incorrect" && "text-danger",
                feedback.kind === "timeout" && "text-warning",
              )}
              style={{ textShadow: "0 0 12px currentColor" }}
            >
              {feedback.kind === "correct"
                ? "✓ Correct"
                : feedback.kind === "incorrect"
                  ? "✗ Wrong"
                  : "⌀ Timeout"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time bar — depletes over trialTimeoutMs */}
      {!feedback && (
        <motion.div
          key={`bar-${trialKey}`}
          className="absolute bottom-0 left-0 h-1 bg-primary shadow-glow"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: timeoutMs / 1000, ease: "linear" }}
        />
      )}
    </div>
  );
}

function CornerBracket({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-4 w-4 border-l-2 border-t-2 border-primary/40 ${className}`}
      aria-hidden
    />
  );
}

/* ─────────────────────────────────────────────
   YES / NO answer button
   ───────────────────────────────────────────── */

function AnswerButton({
  answer,
  onClick,
  disabled,
}: {
  answer: UserAnswer;
  onClick: () => void;
  disabled: boolean;
}) {
  const isYes = answer === "yes";
  const Icon = isYes ? Check : X;
  const label = isYes ? "YES" : "NO"; // "Yes" / "No" in SI/HR
  const tintClass = isYes
    ? "border-success/40 text-success hover:border-success hover:bg-success/10 hover:shadow-glow-success"
    : "border-danger/40 text-danger hover:border-danger hover:bg-danger/10 hover:shadow-glow-danger";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isYes ? "Match" : "No match"}
      className={cn(
        "flex h-20 items-center justify-center gap-2 rounded-xl border-2 bg-surface",
        "font-mono text-lg font-bold uppercase tracking-widest",
        "transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-40",
        "sm:h-24 sm:text-xl",
        tintClass,
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={2.5} />
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Trial pip — compact per-trial status
   ───────────────────────────────────────────── */

function TrialPip({
  result,
  isCurrent,
}: {
  result: TrialResult | undefined;
  isCurrent: boolean;
}) {
  if (!result) {
    return (
      <div
        role="listitem"
        className={cn(
          "h-1.5 rounded-full transition-all duration-300",
          isCurrent ? "w-8 bg-primary shadow-glow" : "w-2 bg-slate-700",
        )}
      />
    );
  }
  return (
    <div
      role="listitem"
      className={cn(
        "h-1.5 w-8 rounded-full",
        result.status === "correct" && "bg-success",
        result.status === "incorrect" && "bg-danger",
        result.status === "timeout" && "bg-warning",
      )}
    />
  );
}
