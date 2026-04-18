"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
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
          <Brain className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Classification label */}
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Test 04 / 07 — Executive Function
      </p>

      <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
        Writing Back
      </h2>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
        A 5-letter word will be shown for 3 seconds. After it disappears, type
        it <span className="text-primary">backwards</span>. This test measures
        working memory and impulse control.
      </p>

      {/* Rules readout — technical, monospace */}
      <div className="mb-10 grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        <Stat label="Memorize" value="3s" />
        <Stat label="Recall" value="≤ 12s" />
        <Stat label="Target" value="≥ 0.8" />
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

      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        SafeGate v1.0 • Cognitive Gate Protocol
      </p>
    </motion.div>
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
