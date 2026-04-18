"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { GameHeader } from "./game-header";
import { ReflexPhase } from "./reflex-phase";
import { ResultScreen } from "./result-screen";
import { StartScreen } from "./start-screen";

import { buildMetrics, scoreRun } from "@/lib/scoringTajmerDugme";
import type { GamePhase, ReflexMetrics, ScoreReport, TrialResult } from "@/lib/typesTajmerDugme";

const TOTAL_TRIALS = 5;

/** Maps a phase → which step dot is active (3 dots: START, TRIALS, RESULT) */
const PHASE_STEP: Record<GamePhase, number> = {
  idle: 0,
  reflex: 1,
  analyzing: 2,
  result: 2,
};

/**
 * Tajmer Dugme — full game state machine.
 *
 *   idle → reflex(N trials) → analyzing → result → (retry → reflex)
 *
 * Captures metrics conforming to GameResult.metrics (start_2.md §4)
 * and produces a ScoreReport consumable by /api/session/submit.
 */
interface TajmerDugmeProps {
  onComplete?: (score: number) => void;
}

export function TajmerDugme({ onComplete }: TajmerDugmeProps = {}) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [metrics, setMetrics] = useState<ReflexMetrics | null>(null);
  const [report, setReport] = useState<ScoreReport | null>(null);

  /* ───────── Transitions ───────── */

  const startGame = () => {
    setMetrics(null);
    setReport(null);
    setPhase("reflex");
  };

  const handleTrialsComplete = (trials: TrialResult[]) => {
    const m = buildMetrics(trials);
    const r = scoreRun(m);
    setMetrics(m);
    setReport(r);

    // Ceremonial "analyzing" pause
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
        title="Fast Reaction Time"
        subtitle="Reflex"
        secondsLeft={null}
        stepIndex={PHASE_STEP[phase]}
        steps={3}
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <StartScreen
                key="start"
                totalTrials={TOTAL_TRIALS}
                onStart={startGame}
              />
            )}

            {phase === "reflex" && (
              <ReflexPhase
                key="reflex"
                totalTrials={TOTAL_TRIALS}
                onTrialsComplete={handleTrialsComplete}
              />
            )}

            {phase === "analyzing" && <AnalyzingView key="analyzing" />}

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
