"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Check } from "lucide-react";

import { GazeDot } from "@/components/gaze-dot";
import { Button } from "@/components/ui/button";
import type { GazePoint } from "@/lib/use-webgazer";
import { cn } from "@/lib/utils";

interface CalibrationPoint {
  /** Normalized [0, 1] position — top-left origin */
  x: number;
  y: number;
  clicks: number;
}

const CLICKS_PER_POINT = 5;

// 5-point layout — four corners + center. Approved for demo path.
const POINTS: ReadonlyArray<Pick<CalibrationPoint, "x" | "y">> = [
  { x: 0.1, y: 0.15 },
  { x: 0.9, y: 0.15 },
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.85 },
  { x: 0.9, y: 0.85 },
];

interface WebGazerCalibrationProps {
  /** Called once per click to train the model */
  onCalibrationClick: (clientX: number, clientY: number) => void;
  /** Fires when all 25 clicks are done */
  onComplete: () => void;
  /** Live gaze point — rendered subtly so the user can verify tracking */
  gaze?: GazePoint | null;
}

export function WebGazerCalibration({
  onCalibrationClick,
  onComplete,
  gaze = null,
}: WebGazerCalibrationProps) {
  const [points, setPoints] = useState<CalibrationPoint[]>(
    POINTS.map((p) => ({ ...p, clicks: 0 })),
  );
  const activeIdx = points.findIndex((p) => p.clicks < CLICKS_PER_POINT);
  const totalClicks = points.reduce((sum, p) => sum + p.clicks, 0);
  const totalNeeded = POINTS.length * CLICKS_PER_POINT;

  const handleClick = (idx: number, event: React.MouseEvent) => {
    if (idx !== activeIdx) return;
    onCalibrationClick(event.clientX, event.clientY);
    setPoints((prev) => {
      const next = prev.map((p, i) =>
        i === idx ? { ...p, clicks: p.clicks + 1 } : p,
      );
      if (next.every((p) => p.clicks >= CLICKS_PER_POINT)) {
        setTimeout(onComplete, 400);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-30 overflow-hidden">
      {/* Instructional overlay — top-center */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-xl border border-slate-800 bg-safegate-surface/90 px-6 py-4 text-center backdrop-blur"
      >
        <p className="text-sm font-medium text-slate-200">
          <span className="text-safegate-primary">Stare</span> at each dot, then
          click it{" "}
          <span className="font-mono text-safegate-primary">
            {CLICKS_PER_POINT}
          </span>{" "}
          times.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Keep your head still. Your eyes must be on the dot when you click.
        </p>
        <p className="mt-2 font-mono text-xs text-slate-500">
          {totalClicks} / {totalNeeded}
        </p>
        {gaze && (
          <p className="mt-1 font-mono text-[10px] text-safegate-success">
            ● tracking
          </p>
        )}
      </motion.div>

      {/* Subtle live gaze indicator — gives the user confidence that the
          camera is actually producing a signal before play begins. */}
      <GazeDot gaze={gaze} subtle />

      {/* Calibration points */}
      {points.map((p, idx) => {
        const done = p.clicks >= CLICKS_PER_POINT;
        const active = idx === activeIdx;
        const remaining = CLICKS_PER_POINT - p.clicks;

        return (
          <motion.button
            key={idx}
            onClick={(e) => handleClick(idx, e)}
            disabled={!active}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 select-none transition-opacity",
              !active && !done && "opacity-30",
              done && "cursor-default",
              active && "cursor-pointer",
            )}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: active || done ? 1 : 0.3 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
          >
            <div className="relative h-16 w-16">
              {active && (
                <span className="absolute inset-0 rounded-full border-2 border-safegate-primary opacity-60 animate-pulse-glow" />
              )}
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-safegate-success text-safegate-bg shadow-glow-success"
                  >
                    <Check className="h-8 w-8" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="active"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute inset-[10px] flex items-center justify-center rounded-full font-mono text-sm font-bold",
                      active
                        ? "bg-safegate-primary text-safegate-bg shadow-glow"
                        : "bg-slate-700 text-slate-300",
                    )}
                  >
                    {active ? remaining : ""}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}

      {/* Dev skip — hidden in prod, handy for hackathon demo */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Button variant="ghost" onClick={onComplete} className="text-xs">
          Skip calibration (demo)
        </Button>
      </div>
    </div>
  );
}
