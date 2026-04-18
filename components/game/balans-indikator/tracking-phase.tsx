"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONFIG,
  TARGET_CENTER,
  TARGET_HALF_WIDTH,
  createInitialState,
  isOnTarget,
  step as stepPhysics,
  type PhysicsState,
} from "@/lib/physicsBalans";
import type { TrackSample } from "@/lib/typesBalans";

interface TrackingPhaseProps {
  durationMs: number;
  /** How often to record a sample (ms). 33 ≈ 30 Hz. */
  sampleIntervalMs?: number;
  onComplete: (samples: TrackSample[], actualDurationMs: number) => void;
}

/**
 * The active tracking game. Runs a physics simulation at rAF speed (~60 Hz)
 * while sampling at ~30 Hz. Two buttons (and ← / →) apply left/right force.
 */
export function TrackingPhase({
  durationMs,
  sampleIntervalMs = 33,
  onComplete,
}: TrackingPhaseProps) {
  // Physics state lives in a ref so the rAF loop mutates it without
  // triggering re-renders. A separate display state is updated at rAF speed.
  const physicsRef = useRef<PhysicsState>(createInitialState());
  const samplesRef = useRef<TrackSample[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Pressed state — which buttons are currently held. Refs for loop, state for UI.
  const leftHeldRef = useRef(false);
  const rightHeldRef = useRef(false);
  const [leftHeldUI, setLeftHeldUI] = useState(false);
  const [rightHeldUI, setRightHeldUI] = useState(false);

  // Display-only state (updated at rAF speed — React can handle 60 Hz of setState fine)
  const [displayX, setDisplayX] = useState(TARGET_CENTER);
  const [onTargetNow, setOnTargetNow] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timeOnTargetPct, setTimeOnTargetPct] = useState(0);

  /* ───────── Main loop ───────── */

  const tick = useCallback(
    (ts: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = ts;
        lastFrameTimeRef.current = ts;
        lastSampleTimeRef.current = ts;
      }

      const elapsed = ts - startTimeRef.current;
      if (elapsed >= durationMs) {
        // Wrap up
        onComplete(samplesRef.current, elapsed);
        return;
      }

      const dt = (ts - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = ts;

      // Resolve input: simultaneous L+R cancels out
      const input: -1 | 0 | 1 =
        leftHeldRef.current && !rightHeldRef.current
          ? -1
          : rightHeldRef.current && !leftHeldRef.current
            ? 1
            : 0;

      // Step physics
      physicsRef.current = stepPhysics(physicsRef.current, dt, input, DEFAULT_CONFIG);

      // Sample at ~30 Hz
      if (ts - lastSampleTimeRef.current >= sampleIntervalMs) {
        const s = physicsRef.current;
        samplesRef.current.push({
          t: Math.round(elapsed),
          x: s.x,
          v: s.v,
          onTarget: isOnTarget(s.x),
          input,
        });
        lastSampleTimeRef.current = ts;
      }

      // Update display state — these are cheap reads and React batches
      setDisplayX(physicsRef.current.x);
      setOnTargetNow(isOnTarget(physicsRef.current.x));
      setElapsedMs(Math.round(elapsed));

      // Running time-on-target percentage for HUD
      if (samplesRef.current.length > 0) {
        const hit = samplesRef.current.filter((s) => s.onTarget).length;
        setTimeOnTargetPct(hit / samplesRef.current.length);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [durationMs, sampleIntervalMs, onComplete],
  );

  // Kick off on mount
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  /* ───────── Input handlers ───────── */

  const pressLeft = () => {
    leftHeldRef.current = true;
    setLeftHeldUI(true);
  };
  const releaseLeft = () => {
    leftHeldRef.current = false;
    setLeftHeldUI(false);
  };
  const pressRight = () => {
    rightHeldRef.current = true;
    setRightHeldUI(true);
  };
  const releaseRight = () => {
    rightHeldRef.current = false;
    setRightHeldUI(false);
  };

  // Keyboard arrows
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore OS-level key repeat; our physics doesn't need it
      if (e.key === "ArrowLeft") pressLeft();
      else if (e.key === "ArrowRight") pressRight();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") releaseLeft();
      else if (e.key === "ArrowRight") releaseRight();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Safety: if the user's finger leaves the button (drags off) or the window
  // loses focus, release all buttons
  useEffect(() => {
    const onBlur = () => {
      releaseLeft();
      releaseRight();
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex w-full flex-col items-center"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary/80">
        Tracking — Keep it green
      </p>
      <div className="mb-8 font-mono text-4xl font-bold tabular-nums text-slate-50 sm:text-5xl">
        <span className={remainingSec <= 3 ? "text-warning" : ""}>
          {remainingSec.toString().padStart(2, "0")}
        </span>
        <span className="ml-1 text-base text-slate-500">s</span>
      </div>

      {/* The rope */}
      <Rope x={displayX} onTarget={onTargetNow} />

      {/* Live metrics row */}
      <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
        <LiveMetric
          label="On Target"
          value={`${Math.round(timeOnTargetPct * 100)}%`}
          good={timeOnTargetPct >= 0.7}
        />
        <LiveMetric
          label="Status"
          value={onTargetNow ? "IN ZONE" : "OFF TARGET"}
          good={onTargetNow}
        />
      </div>

      {/* Control buttons */}
      <div className="mt-8 flex w-full max-w-md gap-4">
        <ControlButton
          direction="left"
          held={leftHeldUI}
          onPress={pressLeft}
          onRelease={releaseLeft}
        />
        <ControlButton
          direction="right"
          held={rightHeldUI}
          onPress={pressRight}
          onRelease={releaseRight}
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   The rope — horizontal track with zones and indicator
   ───────────────────────────────────────────── */

function Rope({ x, onTarget }: { x: number; onTarget: boolean }) {
  const zoneLeftPct = (TARGET_CENTER - TARGET_HALF_WIDTH) * 100;
  const zoneWidthPct = TARGET_HALF_WIDTH * 2 * 100;
  const indicatorLeftPct = x * 100;

  return (
    <div className="relative w-full max-w-md px-4">
      {/* Rope line with zones painted on it */}
      <div
        className={cn(
          "relative h-16 overflow-hidden rounded-full border-2 bg-surface transition-colors duration-150 sm:h-20",
          onTarget ? "border-success/50" : "border-danger/40",
        )}
      >
        {/* Danger zones */}
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-danger/40 to-danger/10"
             style={{ width: `${zoneLeftPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-danger/40 to-danger/10"
             style={{ width: `${zoneLeftPct}%` }} />

        {/* Green target zone */}
        <div
          className="absolute inset-y-0 bg-gradient-to-b from-success/40 to-success/20 shadow-[inset_0_0_30px_rgba(16,185,129,0.5)]"
          style={{ left: `${zoneLeftPct}%`, width: `${zoneWidthPct}%` }}
        />

        {/* Center hairline */}
        <div
          className="absolute top-0 bottom-0 w-px bg-success/60"
          style={{ left: `${TARGET_CENTER * 100}%` }}
        />

        {/* Indicator (the dot the user controls) */}
        <div
          className={cn(
            "absolute top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-75 sm:h-14 sm:w-14",
            onTarget
              ? "border-success bg-success/30 shadow-glow-success"
              : "border-danger bg-danger/30 shadow-glow-danger",
          )}
          style={{ left: `${indicatorLeftPct}%` }}
        >
          <div
            className={cn(
              "absolute inset-2 rounded-full",
              onTarget ? "bg-success" : "bg-danger",
            )}
          />
        </div>
      </div>

      {/* Zone labels */}
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-widest">
        <span className="text-danger/70">← Danger</span>
        <span className="text-success">Target</span>
        <span className="text-danger/70">Danger →</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hold-to-apply L/R button
   ───────────────────────────────────────────── */

interface ControlButtonProps {
  direction: "left" | "right";
  held: boolean;
  onPress: () => void;
  onRelease: () => void;
}

function ControlButton({ direction, held, onPress, onRelease }: ControlButtonProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onRelease();
      }}
      onTouchCancel={onRelease}
      aria-label={direction === "left" ? "Apply force left" : "Apply force right"}
      className={cn(
        "flex h-20 flex-1 items-center justify-center rounded-2xl border-2 font-mono text-sm font-bold uppercase tracking-widest",
        "transition-all duration-75 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "sm:h-24",
        held
          ? "border-primary bg-primary/20 text-primary shadow-glow scale-[0.98]"
          : "border-slate-700 bg-surface text-slate-300 hover:border-primary/50 hover:text-slate-50",
      )}
    >
      <Icon className="h-10 w-10" strokeWidth={2.5} />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Live metric cell
   ───────────────────────────────────────────── */

function LiveMetric({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-lg font-semibold tabular-nums transition-colors",
          good ? "text-success" : "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}
