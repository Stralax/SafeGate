"use client";

import { motion } from "framer-motion";
import { ArrowRight, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOR_META } from "@/lib/typesKartice";

interface StartScreenProps {
  onStart: () => void;
  totalTrials: number;
}

export function StartScreen({ onStart, totalTrials }: StartScreenProps) {
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
          <Palette className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Test 07 / 07 — Impulse Control
      </p>

      <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
        Color Cards
      </h2>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
        A colored shape is shown with a color name. Tap{" "}
        <span className="text-success">YES</span> if the shape&apos;s color
        matches the word, or <span className="text-danger">NO</span> if
        it doesn&apos;t.
      </p>

      {/* Two live examples — correct and incorrect */}
      <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-3">
        <ExampleCard
          swatchHex={COLOR_META.magenta.hex}
          swatchGlow={COLOR_META.magenta.glow}
          wordLabel={COLOR_META.magenta.label}
          answer="yes"
        />
        <ExampleCard
          swatchHex={COLOR_META.magenta.hex}
          swatchGlow={COLOR_META.magenta.glow}
          wordLabel={COLOR_META.blue.label}
          answer="no"
        />
      </div>

      {/* Rules readout */}
      <div className="mb-10 grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        <Stat label="Trials" value={totalTrials.toString()} />
        <Stat label="Per Card" value="≤ 3s" />
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

/** Small preview card showing a swatch + word pair with a correct/incorrect badge */
function ExampleCard({
  swatchHex,
  swatchGlow,
  wordLabel,
  answer,
}: {
  swatchHex: string;
  swatchGlow: string;
  wordLabel: string;
  answer: "yes" | "no";
}) {
  const isYes = answer === "yes";
  return (
    <div
      className={
        "flex flex-col items-center gap-3 rounded-xl border bg-surface p-4 " +
        (isYes ? "border-success/40" : "border-danger/40")
      }
    >
      <div
        className="flex h-16 w-full items-center justify-center rounded-md"
        style={{ backgroundColor: swatchHex, boxShadow: swatchGlow }}
      >
        <span
          className="font-mono text-lg font-bold text-slate-950"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        >
          {wordLabel}
        </span>
      </div>
      <span
        className={
          "font-mono text-[10px] uppercase tracking-widest " +
          (isYes ? "text-success" : "text-danger")
        }
      >
        {isYes ? "✓ YES (match)" : "✗ NO (no match)"}
      </span>
    </div>
  );
}
