"use client";

import { motion } from "framer-motion";
import { CarFront, Check, RotateCcw, TriangleAlert, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ReflexMetrics, ScoreReport, TierStatus, TrialResult } from "@/lib/typesTajmerDugme";
import { cn } from "@/lib/utils";

interface ResultScreenProps {
  metrics: ReflexMetrics;
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

      {/* Hero metric — mean latency — the signature number of this test */}
      {metrics.meanLatencyMs !== null && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
          className="mb-6 flex items-baseline gap-2 font-mono"
        >
          <Zap className="h-6 w-6 self-center text-primary" />
          <span className="text-5xl font-bold tabular-nums text-slate-50 sm:text-6xl">
            {metrics.meanLatencyMs}
          </span>
          <span className="text-xl uppercase tracking-widest text-slate-500">
            ms avg
          </span>
        </motion.div>
      )}

      {/* Animated composite score */}
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

      {/* Aggregate stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-4 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"
      >
        <DataCell
          label="Valid Trials"
          value={`${metrics.validTrials} / ${metrics.totalTrials}`}
        />
        <DataCell label="False Starts" value={metrics.falseStarts.toString()} />
        <DataCell
          label="Fastest"
          value={metrics.fastestMs !== null ? `${metrics.fastestMs} ms` : "—"}
        />
        <DataCell
          label="Slowest"
          value={metrics.slowestMs !== null ? `${metrics.slowestMs} ms` : "—"}
        />
        <DataCell
          label="Accuracy"
          value={`${Math.round(report.accuracy * 100)}%`}
        />
        <DataCell
          label="Latency Norm"
          value={`${Math.round(report.latencyNorm * 100)}%`}
        />
      </motion.div>

      {/* Per-trial breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mb-8 w-full max-w-md"
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Per-trial breakdown
        </p>
        <div className="grid grid-cols-5 gap-2">
          {metrics.trials.map((t) => (
            <TrialCell key={t.index} trial={t} />
          ))}
        </div>
      </motion.div>

      {/* Primary action — per §4C */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
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
   Tier configuration (identical treatment across games —
   this is the SafeGate brand-level contract)
   ───────────────────────────────────────────── */

function tierConfig(tier: TierStatus) {
  switch (tier) {
    case "APPROVED":
      return {
        tierLabel: "Tier 1 — Approved",
        tierLabelColor: "text-success",
        headline: "Reflex Within Sober Range",
        body: "Reaction time and false-start rate within expected limits. Have a safe drive.",
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
        body: "Your reflex response fell in the gray area. A second test will be required to confirm readiness to drive.",
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

function TrialCell({ trial }: { trial: TrialResult }) {
  if (trial.status === "false-start") {
    return (
      <div className="flex h-10 flex-col items-center justify-center rounded-md border border-danger/50 bg-danger/10 font-mono text-[10px] uppercase tracking-widest text-danger">
        Early
      </div>
    );
  }
  if (trial.status === "timeout") {
    return (
      <div className="flex h-10 flex-col items-center justify-center rounded-md border border-warning/50 bg-warning/10 font-mono text-[10px] uppercase tracking-widest text-warning">
        Miss
      </div>
    );
  }
  return (
    <div className="flex h-10 flex-col items-center justify-center rounded-md border border-success/40 bg-success/10 font-mono text-[11px] font-semibold tabular-nums text-success">
      {trial.latencyMs}
    </div>
  );
}
