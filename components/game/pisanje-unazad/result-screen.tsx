"use client";

import { motion } from "framer-motion";
import { CarFront, Check, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ReverseTypeMetrics, ScoreReport, TierStatus } from "@/lib/typesPisanjeUnazad";
import { cn } from "@/lib/utils";

interface ResultScreenProps {
  metrics: ReverseTypeMetrics;
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
      {/* Tier badge — the hero element */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
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

      {/* Animated score */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 24 }}
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

      {/* Metrics readout */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-8 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"
      >
        <DataCell label="Word" value={metrics.word} mono />
        <DataCell label="Target" value={metrics.target} mono />
        <DataCell label="Your Answer" value={metrics.answer || "—"} mono />
        <DataCell
          label="Match"
          value={`${metrics.matched}/${metrics.target.length}`}
          mono
        />
        <DataCell label="Latency" value={`${metrics.latencyMs} ms`} mono />
        <DataCell
          label="Corrections"
          value={metrics.corrections.toString()}
          mono
        />
        <DataCell
          label="Accuracy"
          value={`${Math.round(report.accuracy * 100)}%`}
          mono
        />
        <DataCell
          label="Latency Norm"
          value={`${Math.round(report.latencyNorm * 100)}%`}
          mono
        />
      </motion.div>

      {/* Primary action — per §4C: Call Taxi for denied */}
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
   Tier configuration
   ───────────────────────────────────────────── */

function tierConfig(tier: TierStatus) {
  switch (tier) {
    case "APPROVED":
      return {
        tierLabel: "Tier 1 — Approved",
        tierLabelColor: "text-success",
        headline: "Cognitive Check Passed",
        body: "Motor and working-memory response within sober baseline. Have a safe drive.",
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
        body: "Your response fell in the gray area. A second test will be required to confirm readiness to drive.",
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
      // easeOutQuad
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

function DataCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold text-slate-50",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </p>
    </div>
  );
}
