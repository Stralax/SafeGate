"use client";

import { motion } from "framer-motion";
import { ArrowRight, Move, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StartScreenProps {
  onStart: () => void;
  durationSec: number;
}

export function StartScreen({ onStart, durationSec }: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center text-center"
    >
      {/* Diagnostic glyph */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/40 bg-surface shadow-glow">
          <Target className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Test 08 / 07+ — Motor Tracking
      </p>

      <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
        Balance Indicator
      </h2>
      <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
        The indicator drifts along the rope on its own. Use the{" "}
        <span className="text-primary">Left</span> and{" "}
        <span className="text-primary">Right</span> buttons to keep it inside
        the <span className="text-success">green zone</span>. Don&apos;t
        overcorrect — smooth control scores higher than frantic tapping.
      </p>

      {/* Mini preview of what the rope looks like */}
      <RopePreview />

      {/* Rules readout */}
      <div className="mb-10 grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        <Stat label="Duration" value={`${durationSec}s`} />
        <Stat label="Zone" value="20%" />
        <Stat label="Pass" value="≥ 0.8" />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        className="w-full max-w-sm"
      >
        Begin Diagnostic
        <ArrowRight className="h-5 w-5" />
      </Button>

      <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        <Move className="h-3 w-3" /> Keyboard: ← and → also supported
      </p>
    </motion.div>
  );
}

/* Miniature rope preview — teaches the rules visually */
function RopePreview() {
  return (
    <div className="relative mb-8 w-full max-w-md">
      <div className="relative h-8 overflow-hidden rounded-full border border-slate-800 bg-surface">
        {/* Red left zone */}
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-danger/30 to-danger/10" />
        {/* Green target zone */}
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-gradient-to-b from-success/40 to-success/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.4)]" />
        {/* Red right zone */}
        <div className="absolute inset-y-0 right-0 w-[40%] bg-gradient-to-l from-danger/30 to-danger/10" />

        {/* Sample indicator pulsing in the green zone */}
        <motion.div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 shadow-glow"
          initial={{ left: "48%" }}
          animate={{ left: ["45%", "55%", "48%", "52%", "45%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-600">
        <span className="text-danger">Danger</span>
        <span className="text-success">Target</span>
        <span className="text-danger">Danger</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-50">
        {value}
      </p>
    </div>
  );
}
