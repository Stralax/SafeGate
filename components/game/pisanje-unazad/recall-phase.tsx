"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RecallPhaseProps {
  /** length of the word (always 5 in current design, but parameterized) */
  length: number;
  /** seconds allowed before auto-submit of whatever is entered */
  timeoutSec?: number;
  /**
   * Called when the user submits a complete answer OR the timer expires.
   * Provides the typed string (may be shorter than `length` on timeout),
   * plus # of backspace corrections and ms elapsed.
   */
  onSubmit: (answer: string, corrections: number, latencyMs: number) => void;
}

export function RecallPhase({
  length,
  timeoutSec = 12,
  onSubmit,
}: RecallPhaseProps) {
  const [values, setValues] = useState<string[]>(() => Array(length).fill(""));
  const [activeIdx, setActiveIdx] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const [shake, setShake] = useState(false);
  const [remaining, setRemaining] = useState(timeoutSec);
  const [elapsedMs, setElapsedMs] = useState(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const startedAt = useRef<number>(performance.now());
  const submittedRef = useRef(false);

  // Focus first slot on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Live-update the elapsed display at ~10fps — cheap and readable
  useEffect(() => {
    const id = setInterval(() => {
      if (submittedRef.current) return;
      setElapsedMs(performance.now() - startedAt.current);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Countdown timer → auto-submit on expiry
  useEffect(() => {
    if (submittedRef.current) return;
    if (remaining <= 0) {
      submit(values.join(""));
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const submit = (answer: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const latencyMs = Math.round(performance.now() - startedAt.current);
    onSubmit(answer, corrections, latencyMs);
  };

  const setAt = (i: number, ch: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = ch;
      return next;
    });
  };

  const handleChange = (i: number, raw: string) => {
    // Only accept single A–Z letters
    const char = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    if (!char) {
      setAt(i, "");
      return;
    }
    setAt(i, char);

    // Advance or submit
    if (i < length - 1) {
      setActiveIdx(i + 1);
      inputsRef.current[i + 1]?.focus();
    } else {
      // Last slot — check completion
      const finalAnswer = values.map((v, idx) => (idx === i ? char : v)).join("");
      if (finalAnswer.length === length && !finalAnswer.includes("")) {
        // Small delay so user sees the final character land
        setTimeout(() => submit(finalAnswer), 150);
      }
    }
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (values[i]) {
        setAt(i, "");
        setCorrections((c) => c + 1);
        setShake(true);
        setTimeout(() => setShake(false), 400);
      } else if (i > 0) {
        setActiveIdx(i - 1);
        inputsRef.current[i - 1]?.focus();
        setAt(i - 1, "");
        setCorrections((c) => c + 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      setActiveIdx(i - 1);
      inputsRef.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      setActiveIdx(i + 1);
      inputsRef.current[i + 1]?.focus();
      e.preventDefault();
    } else if (e.key === "Enter") {
      submit(values.join(""));
      e.preventDefault();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Recall — Reverse
      </p>
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
        Type the word{" "}
        <span className="text-primary">backwards</span>
      </h2>

      {/* Slot inputs */}
      <div
        className={cn(
          "mb-8 flex gap-2 sm:gap-3",
          shake && "animate-shake",
        )}
      >
        {values.map((val, i) => {
          const isActive = i === activeIdx;
          const isFilled = val !== "";
          return (
            <div key={i} className="relative">
              <input
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={() => setActiveIdx(i)}
                aria-label={`Letter ${i + 1} of ${length}`}
                className={cn(
                  "h-16 w-12 rounded-xl border-2 bg-slate-900 text-center",
                  "font-mono text-3xl font-bold uppercase text-slate-50",
                  "caret-transparent transition-all duration-200",
                  "focus:outline-none sm:h-20 sm:w-16 sm:text-4xl",
                  isActive
                    ? "border-primary shadow-glow"
                    : isFilled
                      ? "border-slate-600"
                      : "border-slate-800",
                )}
              />
              {isActive && !isFilled && (
                <motion.div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-primary sm:h-10"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Live metrics — monospace, per §3 */}
      <div className="grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        <Metric
          label="Elapsed"
          value={`${(elapsedMs / 1000).toFixed(1)}s`}
          warn={remaining <= 3}
        />
        <Metric
          label="Corrections"
          value={corrections.toString().padStart(2, "0")}
          warn={corrections >= 3}
        />
      </div>

      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Press Enter to submit early
      </p>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-lg font-semibold tabular-nums",
          warn ? "text-warning" : "text-slate-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
