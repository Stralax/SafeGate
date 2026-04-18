"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { GameHeader } from "./game-header";
import { MemorizePhase } from "./memorize-phase";
import { RecallPhase } from "./recall-phase";
import { ResultScreen } from "./result-screen";
import { StartScreen } from "./start-screen";

import { countMatched, scoreRun } from "@/lib/scoringPisanjeUnazad";
import type { GamePhase, ReverseTypeMetrics, ScoreReport } from "@/lib/typesPisanjeUnazad";
import { pickRandomWord, reverseWord } from "@/lib/wordsPisanjeUnazad";

const MEMORIZE_SEC = 3;
const RECALL_TIMEOUT_SEC = 12;

/** Maps a phase → which step dot is active (0-indexed, 3 dots) */
const PHASE_STEP: Record<GamePhase, number> = {
  idle: 0,
  memorize: 0,
  recall: 1,
  analyzing: 2,
  result: 2,
};

/**
 * Pisanje Unazad — full game state machine.
 *
 *   idle → memorize → recall → analyzing → result → (retry → memorize)
 *
 * Captures metrics conforming to GameResult.metrics (start_2.md §4)
 * and produces a ScoreReport consumable by /api/session/submit.
 */
interface PisanjeUnazadProps {
  onComplete?: (score: number) => void;
}

export function PisanjeUnazad({ onComplete }: PisanjeUnazadProps = {}) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [word, setWord] = useState<string>("");
  const [metrics, setMetrics] = useState<ReverseTypeMetrics | null>(null);
  const [report, setReport] = useState<ScoreReport | null>(null);
  const prevWord = useRef<string>("");

  const target = useMemo(() => reverseWord(word), [word]);

  // Header timer — only shown during memorize + recall
  const [headerTimer, setHeaderTimer] = useState<number | null>(null);
  useEffect(() => {
    if (phase === "memorize") setHeaderTimer(MEMORIZE_SEC);
    else if (phase === "recall") setHeaderTimer(RECALL_TIMEOUT_SEC);
    else setHeaderTimer(null);
  }, [phase]);

  useEffect(() => {
    if (headerTimer === null || headerTimer <= 0) return;
    const id = setTimeout(() => setHeaderTimer((t) => (t === null ? null : t - 1)), 1000);
    return () => clearTimeout(id);
  }, [headerTimer]);

  /* ───────── Transitions ───────── */

  const startGame = () => {
    const next = pickRandomWord(prevWord.current);
    prevWord.current = next;
    setWord(next);
    setMetrics(null);
    setReport(null);
    setPhase("memorize");
  };

  const handleMemorizeComplete = () => {
    setPhase("recall");
  };

  const handleRecallSubmit = (
    answer: string,
    corrections: number,
    latencyMs: number,
  ) => {
    const normalized = answer.toUpperCase();
    const matched = countMatched(normalized, target);
    const m: ReverseTypeMetrics = {
      word,
      answer: normalized,
      target,
      latencyMs,
      corrections,
      matched,
      perfect: normalized === target,
    };
    setMetrics(m);
    setReport(scoreRun(m));

    // Brief "analyzing" phase for ceremonial feel
    setPhase("analyzing");
    setTimeout(() => setPhase("result"), 900);
  };

  /* ───────── Render ───────── */

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-radial-fade" />

      <GameHeader
        title="Writing Back"
        subtitle="Executive Function"
        secondsLeft={headerTimer}
        stepIndex={PHASE_STEP[phase]}
        steps={3}
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <StartScreen key="start" onStart={startGame} />
            )}

            {phase === "memorize" && (
              <MemorizePhase
                key={`memorize-${word}`}
                word={word}
                durationSec={MEMORIZE_SEC}
                onComplete={handleMemorizeComplete}
              />
            )}

            {phase === "recall" && (
              <RecallPhase
                key={`recall-${word}`}
                length={word.length}
                timeoutSec={RECALL_TIMEOUT_SEC}
                onSubmit={handleRecallSubmit}
              />
            )}

            {phase === "analyzing" && (
              <AnalyzingView key="analyzing" />
            )}

            {phase === "result" && metrics && report && (
              <ResultScreen
                key="result"
                metrics={metrics}
                report={report}
                onRetry={startGame}
                onContinue={onComplete ? () => onComplete(report.score) : undefined}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 bg-background/60 py-3 backdrop-blur">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
          SafeGate • Cognitive Gate Protocol • v1.0
        </p>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Analyzing (brief ceremonial loading)
   ───────────────────────────────────────────── */
function AnalyzingView() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary" />
        <div className="absolute inset-2 rounded-full border-2 border-primary/40" />
        <div className="absolute inset-5 rounded-full bg-primary shadow-glow" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
        Analyzing Response
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Computing composite sobriety score…
      </p>
    </div>
  );
}
