"use client";

import { motion } from "framer-motion";
import { CarFront, Check, RotateCcw, Target, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TARGET_CENTER, TARGET_HALF_WIDTH } from "@/lib/physicsBalans";
import type { BalanceMetrics, ScoreReport, TierStatus } from "@/lib/typesBalans";
import { cn } from "@/lib/utils";

interface ResultScreenProps {
  metrics: BalanceMetrics;
  report: ScoreReport;
  onRetry: () => void;
  onContinue?: () => void;
}

export function ResultScreen({ metrics, report, onRetry, onContinue }: ResultScreenProps) {
  const cfg = tierConfig(report.tier);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      {/* Tier badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className={cn(
          "relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2",
          cfg.badgeBorder,
          cfg.badgeBg,
          cfg.badgeShadow,
        )}
      >
        <cfg.Icon className={cn("h-12 w-12", cfg.iconColor)} strokeWidth={2} />
      </motion.div>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "font-mono text-xs uppercase tracking-[0.3em]",
          cfg.tierLabelColor,
        )}
      >
        {cfg.tierLabel}
      </motion.p>
      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-2 mt-1 text-center text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
      >
        {cfg.headline}
      </motion.h2>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 max-w-md text-center text-sm text-slate-400"
      >
        {cfg.body}
      </motion.p>

      {/* Hero metric — time on target */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
        className="mb-6 flex items-baseline gap-2 font-mono"
      >
        <Target className="h-6 w-6 self-center text-primary" />
        <span className="text-5xl font-bold tabular-nums text-slate-50 sm:text-6xl">
          {Math.round(metrics.timeOnTarget * 100)}
        </span>
        <span className="text-xl uppercase tracking-widest text-slate-500">
          % on target
        </span>
      </motion.div>

      {/* Composite score bar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mb-6 w-full max-w-md"
      >
        <div className="mb-2 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-slate-500">
          <span>Composite Score</span>
          <AnimatedScore target={report.score} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className={cn("h-full", cfg.barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${report.score * 100}%` }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Trajectory visualization — shows where you actually were over time */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="mb-6 w-full max-w-md"
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Trajectory (position over time)
        </p>
        <Trajectory metrics={metrics} />
      </motion.div>

      {/* Aggregate stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="mb-8 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"
      >
        <DataCell
          label="Longest Streak"
          value={`${(metrics.longestOnTargetMs / 1000).toFixed(1)}s`}
        />
        <DataCell label="Excursions" value={metrics.excursions.toString()} />
        <DataCell
          label="RMS Error"
          value={metrics.rmsError.toFixed(3)}
        />
        <DataCell
          label="Input Reversals"
          value={metrics.inputReversals.toString()}
        />
        <DataCell
          label="Accuracy"
          value={`${Math.round(report.accuracy * 100)}%`}
        />
        <DataCell
          label="Smoothness"
          value={`${Math.round(report.latencyNorm * 100)}%`}
        />
      </motion.div>

      {/* Primary action — per §4C */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="flex w-full max-w-md flex-col gap-3"
      >
        {onContinue && (
          <Button variant="primary" size="lg" onClick={onContinue} className="w-full">
            <CarFront className="h-5 w-5" />
            Continue
          </Button>
        )}
        <Button variant="ghost" size="default" onClick={onRetry} className="w-full">
          <RotateCcw className="h-4 w-4" />
          Retry Diagnostic
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Trajectory sparkline — SVG visualization of the full trace
   ───────────────────────────────────────────── */
function Trajectory({ metrics }: { metrics: BalanceMetrics }) {
  const W = 500;
  const H = 80;
  const samples = metrics.samples;
  if (samples.length === 0) {
    return <div className="h-20 rounded-lg border border-slate-800 bg-surface" />;
  }

  const maxT = samples[samples.length - 1].t;
  const zoneTop = (TARGET_CENTER - TARGET_HALF_WIDTH) * H;
  const zoneHeight = TARGET_HALF_WIDTH * 2 * H;

  // Build a path for the trace
  const path = samples
    .map((s, i) => {
      const x = (s.t / maxT) * W;
      const y = s.x * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-surface">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-20 w-full" preserveAspectRatio="none">
        {/* Danger zones top and bottom */}
        <rect x={0} y={0} width={W} height={zoneTop} fill="rgba(225,29,72,0.08)" />
        <rect
          x={0}
          y={zoneTop + zoneHeight}
          width={W}
          height={H - zoneTop - zoneHeight}
          fill="rgba(225,29,72,0.08)"
        />

        {/* Green target band */}
        <rect x={0} y={zoneTop} width={W} height={zoneHeight} fill="rgba(16,185,129,0.12)" />

        {/* Center line */}
        <line
          x1={0}
          y1={TARGET_CENTER * H}
          x2={W}
          y2={TARGET_CENTER * H}
          stroke="rgba(16,185,129,0.3)"
          strokeDasharray="2 4"
        />

        {/* The trajectory */}
        <path
          d={path}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-x-2 bottom-1 flex justify-between font-mono text-[9px] uppercase tracking-widest text-slate-600">
        <span>0s</span>
        <span>{(maxT / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tier config (identical contract across games)
   ───────────────────────────────────────────── */

function tierConfig(tier: TierStatus) {
  switch (tier) {
    case "APPROVED":
      return {
        tierLabel: "Tier 1 — Approved",
        tierLabelColor: "text-success",
        headline: "Motor Control Within Sober Range",
        body: "Tracking accuracy and input smoothness within expected limits. Have a safe drive.",
        Icon: Check,
        iconColor: "text-success",
        badgeBorder: "border-success/60",
        badgeBg: "bg-success/10",
        badgeShadow: "shadow-glow-success",
        barColor: "bg-success shadow-glow-success",
      };
    case "RECALIBRATING":
      return {
        tierLabel: "Tier 2 — Recalibrate",
        tierLabelColor: "text-warning",
        headline: "Additional Verification Required",
        body: "Your motor-control response fell in the gray area. A second test will be required to confirm readiness to drive.",
        Icon: TriangleAlert,
        iconColor: "text-warning",
        badgeBorder: "border-warning/60",
        badgeBg: "bg-warning/10",
        badgeShadow: "shadow-glow-warning",
        barColor: "bg-warning shadow-glow-warning",
      };
    case "DENIED":
      return {
        tierLabel: "Tier 3 — Denied",
        tierLabelColor: "text-danger",
        headline: "Access Denied",
        body: "Significant impairment detected. Vehicle access is blocked. Please choose a safer mobility option.",
        Icon: TriangleAlert,
        iconColor: "text-danger",
        badgeBorder: "border-danger/60",
        badgeBg: "bg-danger/10",
        badgeShadow: "shadow-glow-danger",
        barColor: "bg-danger shadow-glow-danger",
      };
  }
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function AnimatedScore({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayed(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span className="font-mono text-lg font-semibold tabular-nums text-slate-50">
      {displayed.toFixed(2)}
    </span>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50">
        {value}
      </p>
    </div>
  );
}
