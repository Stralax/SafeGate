"use client";

import { motion } from "framer-motion";
import { Car, RefreshCw, ShieldCheck, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/types";

interface TierResultProps {
  tier: Tier;
  score: number;
  accuracy: number;
  /** Per-game secondary metric — e.g. latency for SWIPE, smoothness for OCULAR */
  secondary: { label: string; value: string };
  onRetry?: () => void;
  onUnlock?: () => void;
  onCallTaxi?: () => void;
}

const COPY: Record<Tier, { title: string; subtitle: string; icon: typeof ShieldCheck }> = {
  APPROVED: {
    title: "Vehicle Unlocked",
    subtitle: "You're clear to drive. Safe travels.",
    icon: ShieldCheck,
  },
  RECALIBRATE: {
    title: "Recalibration Required",
    subtitle: "One more quick test to verify focus.",
    icon: RefreshCw,
  },
  DENIED: {
    title: "Access Denied",
    subtitle: "We've got a safer option ready for you.",
    icon: ShieldX,
  },
};

export function TierResult({
  tier,
  score,
  accuracy,
  secondary,
  onRetry,
  onUnlock,
  onCallTaxi,
}: TierResultProps) {
  const { title, subtitle, icon: Icon } = COPY[tier];

  const wrapperTone =
    tier === "APPROVED"
      ? "from-safegate-success/25 via-safegate-surface to-safegate-bg shadow-glow-success"
      : tier === "RECALIBRATE"
        ? "from-safegate-warning/25 via-safegate-surface to-safegate-bg"
        : "from-safegate-danger/25 via-safegate-surface to-safegate-bg shadow-glow-danger";

  const iconTone =
    tier === "APPROVED"
      ? "text-safegate-success"
      : tier === "RECALIBRATE"
        ? "text-safegate-warning"
        : "text-safegate-danger";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-8 rounded-xl border border-slate-800 bg-gradient-to-br p-8 text-center",
        wrapperTone,
      )}
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
        className={cn("rounded-full bg-safegate-bg p-5", iconTone)}
      >
        <Icon className="h-12 w-12" strokeWidth={1.8} />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-50">{title}</h2>
        <p className="text-slate-400 font-medium">{subtitle}</p>
      </div>

      <dl className="grid w-full grid-cols-3 gap-3 rounded-xl border border-slate-800 bg-safegate-bg/60 p-4 text-left">
        <Metric label="Score" value={(score * 100).toFixed(0) + "%"} />
        <Metric label="Accuracy" value={(accuracy * 100).toFixed(0) + "%"} />
        <Metric label={secondary.label} value={secondary.value} />
      </dl>

      <div className="flex w-full flex-col gap-3">
        {tier === "APPROVED" && onUnlock && (
          <Button variant="success" size="lg" onClick={onUnlock}>
            <Car className="h-5 w-5" /> Unlock Vehicle
          </Button>
        )}
        {tier === "RECALIBRATE" && onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry}>
            <RefreshCw className="h-5 w-5" /> Start Recalibration
          </Button>
        )}
        {tier === "DENIED" && onCallTaxi && (
          <Button variant="danger" size="lg" onClick={onCallTaxi}>
            <Car className="h-5 w-5" /> Call Taxi
          </Button>
        )}
        {onRetry && tier !== "RECALIBRATE" && (
          <Button variant="ghost" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="font-mono text-base font-semibold text-slate-50">{value}</dd>
    </div>
  );
}
