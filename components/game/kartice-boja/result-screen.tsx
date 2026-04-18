"use client";

import { motion } from "framer-motion";
import { CarFront, Check, RotateCcw, TriangleAlert, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ScoreReport, StroopMetrics, TierStatus } from "@/lib/typesKartice";
import { cn } from "@/lib/utils";

interface ResultScreenProps {
  metrics: StroopMetrics;
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

      {/* Hero metric — Stroop interference (the signature of this test) */}
      {metrics.interferenceMs !== null && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
          className="mb-6 flex items-baseline gap-2 font-mono"
        >
          <Zap className="h-6 w-6 self-center text-primary" />
          <span className="text-5xl font-bold tabular-nums text-slate-50 sm:text-6xl">
            {metrics.interferenceMs > 0 ? "+" : ""}
            {metrics.interferenceMs}
          </span>
          <span className="text-lg uppercase tracking-widest text-slate-500">
            ms interference
          </span>
        </motion.div>
      )}
      <p className="mb-6 max-w-xs text-center font-mono text-[10px] uppercase tracking-widest text-slate-600">
        Difference between incongruent & congruent latencies
      </p>

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

      {/* Latency comparison bars — visualizes interference viscerally */}
      {metrics.meanMatchLatencyMs !== null && metrics.meanMismatchLatencyMs !== null && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mb-6 w-full max-w-md rounded-xl border border-slate-800 bg-surface p-4"
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Latency breakdown
          </p>
          <LatencyBar
            label="Match (YES)"
            latency={metrics.meanMatchLatencyMs}
            color="success"
          />
          <div className="mt-3">
            <LatencyBar
              label="Mismatch (NO)"
              latency={metrics.meanMismatchLatencyMs}
              color="primary"
            />
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="mb-8 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"
      >
        <DataCell
          label="Correct"
          value={`${metrics.correctCount} / ${metrics.totalTrials}`}
        />
        <DataCell
          label="Mismatch Acc"
          value={`${Math.round(metrics.mismatchAccuracy * 100)}%`}
        />
        <DataCell
          label="Mean RT"
          value={metrics.meanLatencyMs !== null ? `${metrics.meanLatencyMs} ms` : "—"}
        />
        <DataCell
          label="Timeouts"
          value={metrics.timeoutCount.toString()}
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

      {/* Primary action */}
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
   Latency comparison bar — visualizes congruent vs incongruent
   ───────────────────────────────────────────── */

const BAR_MAX_MS = 1500; // visual ceiling — bars saturate here

function LatencyBar({
  label,
  latency,
  color,
}: {
  label: string;
  latency: number;
  color: "success" | "primary";
}) {
  const widthPct = Math.min((latency / BAR_MAX_MS) * 100, 100);
  const colorClass =
    color === "success" ? "bg-success shadow-glow-success" : "bg-primary shadow-glow";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300 tabular-nums">{latency} ms</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
        <motion.div
          className={cn("h-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Tier config (shared contract)
   ───────────────────────────────────────────── */

function tierConfig(tier: TierStatus) {
  switch (tier) {
    case "APPROVED":
      return {
        tierLabel: "Tier 1 — Approved",
        tierLabelColor: "text-success",
        headline: "Impulse Control Within Sober Range",
        body: "Stroop interference and accuracy within expected limits. Have a safe drive.",
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
        body: "Your impulse-control response fell in the gray area. A second test will be required to confirm readiness to drive.",
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
