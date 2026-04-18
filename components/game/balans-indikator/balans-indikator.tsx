"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";

import { CountdownPhase } from "./countdown-phase";
import { GameHeader } from "./game-header";
import { ResultScreen } from "./result-screen";
import { StartScreen } from "./start-screen";
import { TrackingPhase } from "./tracking-phase";

import { buildMetrics, scoreRun } from "@/lib/scoringBalans";
import type { BalanceMetrics, GamePhase, ScoreReport, TrackSample } from "@/lib/typesBalans";

const DURATION_MS = 15_000; // 15 seconds of tracking
const DURATION_SEC = DURATION_MS / 1000;

/** Maps a phase → which step dot is active (3 dots: START, TRACK, RESULT) */
const PHASE_STEP: Record<GamePhase, number> = {
  idle: 0,
  countdown: 1,
  tracking: 1,
  analyzing: 2,
  result: 2,
};

/**
 * Balans Indikator — full game state machine.
 *
 *   idle → countdown(3-2-1-GO) → tracking(15s) → analyzing → result
 *                                                                │
 *                                                                └──► idle (retry)
 */
interface BalansIndikatorProps {
  onComplete?: (score: number) => void;
}

export function BalansIndikator({ onComplete }: BalansIndikatorProps = {}) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [metrics, setMetrics] = useState<BalanceMetrics | null>(null);
  const [report, setReport] = useState<ScoreReport | null>(null);

  const startGame = () => {
    setMetrics(null);
    setReport(null);
    setPhase("countdown");
  };

  const handleCountdownComplete = () => {
    setPhase("tracking");
  };

  const handleTrackingComplete = (
    samples: TrackSample[],
    actualDurationMs: number,
  ) => {
    const m = buildMetrics(samples, actualDurationMs);
    const r = scoreRun(m);
    setMetrics(m);
    setReport(r);

    // Ceremonial "analyzing" pause
    setPhase("analyzing");
    setTimeout(() => setPhase("result"), 900);
  };

  // Header timer — live countdown during tracking only
  const headerTimer =
    phase === "tracking"
      ? DURATION_SEC
      : null;

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-radial-fade" />

      <GameHeader
        title="Balance Indicator"
        subtitle="Motor Tracking"
        secondsLeft={headerTimer}
        stepIndex={PHASE_STEP[phase]}
        steps={3}
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <StartScreen
                key="start"
                durationSec={DURATION_SEC}
                onStart={startGame}
              />
            )}

            {phase === "countdown" && (
              <CountdownPhase key="countdown" onComplete={handleCountdownComplete} />
            )}

            {phase === "tracking" && (
              <TrackingPhase
                key="tracking"
                durationMs={DURATION_MS}
                onComplete={handleTrackingComplete}
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

function AnalyzingView() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary" />
        <div className="absolute inset-2 rounded-full border-2 border-primary/40" />
        <div className="absolute inset-5 rounded-full bg-primary shadow-glow" />
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
        Analyzing Trajectory
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Computing composite sobriety score…
      </p>
    </div>
  );
}
