"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoveLeft, MoveRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SwipeAttempt, SwipeSide } from "@/lib/types";

interface SwipeCardDeckProps {
  totalRounds?: number;
  /** Called once all cards are swiped. Receives every attempt, in order. */
  onComplete: (attempts: SwipeAttempt[]) => void;
}

const SWIPE_THRESHOLD_PX = 100;

function generateDeck(count: number): number[] {
  // Keep numbers 2-digit to stay visually dense; mix even/odd roughly 50/50.
  return Array.from({ length: count }, () => Math.floor(Math.random() * 98) + 2);
}

export function SwipeCardDeck({ totalRounds = 10, onComplete }: SwipeCardDeckProps) {
  const deck = useMemo(() => generateDeck(totalRounds), [totalRounds]);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<SwipeAttempt[]>([]);
  const shownAt = useRef<number>(performance.now());

  const x = useMotionValue(0);
  // design.md §1 — LEFT=Amber (warning) hint, RIGHT=Cyan (primary) hint
  const background = useTransform(
    x,
    [-200, -40, 0, 40, 200],
    [
      "rgba(251, 191, 36, 0.20)",
      "rgba(251, 191, 36, 0.05)",
      "rgba(15, 23, 42, 1)",
      "rgba(34, 211, 238, 0.05)",
      "rgba(34, 211, 238, 0.20)",
    ],
  );
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  useEffect(() => {
    shownAt.current = performance.now();
    x.set(0);
  }, [index, x]);

  const recordSwipe = (side: SwipeSide) => {
    if (index >= deck.length) return;
    const latencyMs = Math.round(performance.now() - shownAt.current);
    const attempt: SwipeAttempt = { number: deck[index], chosenSide: side, latencyMs };
    const next = [...attempts, attempt];
    setAttempts(next);

    if (next.length >= deck.length) {
      onComplete(next);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const current = deck[index];
  const done = index >= deck.length;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      {/* Instruction legend */}
      <div className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest">
        <span className="flex items-center gap-2 text-safegate-warning">
          <MoveLeft className="h-4 w-4" /> Even → Left
        </span>
        <span className="flex items-center gap-2 text-safegate-primary">
          Odd → Right <MoveRight className="h-4 w-4" />
        </span>
      </div>

      {/* Card stack */}
      <div className="relative flex h-[360px] w-full items-center justify-center">
        {/* Ghost of next card peeking behind */}
        {!done && index + 1 < deck.length && (
          <div className="absolute inset-0 translate-y-4 scale-95 rounded-xl border border-slate-800 bg-safegate-surface/70" />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {!done && (
            <motion.div
              key={index}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              style={{ x, rotate, background }}
              onDragEnd={(_, info) => {
                if (info.offset.x > SWIPE_THRESHOLD_PX) {
                  recordSwipe("RIGHT");
                } else if (info.offset.x < -SWIPE_THRESHOLD_PX) {
                  recordSwipe("LEFT");
                }
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "absolute inset-0 flex cursor-grab select-none items-center justify-center rounded-xl border border-slate-800 shadow-glow active:cursor-grabbing",
              )}
            >
              <span className="font-mono text-[128px] font-bold leading-none text-slate-50">
                {current}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tap-target fallbacks — design.md §2 — mandatory 48px+ buttons */}
      <div className="grid w-full grid-cols-2 gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => recordSwipe("LEFT")}
          disabled={done}
          className="border-safegate-warning/50 text-safegate-warning hover:border-safegate-warning"
        >
          <MoveLeft className="h-5 w-5" /> Even
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => recordSwipe("RIGHT")}
          disabled={done}
          className="border-safegate-primary/50 text-safegate-primary hover:border-safegate-primary"
        >
          Odd <MoveRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Round counter */}
      <div className="font-mono text-sm text-slate-400">
        Round <span className="text-slate-50">{Math.min(index + 1, deck.length)}</span> /{" "}
        {deck.length}
      </div>
    </div>
  );
}
