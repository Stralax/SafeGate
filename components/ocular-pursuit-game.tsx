"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { GazeDot } from "@/components/gaze-dot";
import { targetAt } from "@/lib/ocular-path";
import type { GazePoint } from "@/lib/use-webgazer";
import type { OcularSample } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OcularPursuitGameProps {
  pathSeed: number;
  gaze: GazePoint | null;
  durationMs: number;
  onComplete: (samples: OcularSample[]) => void;
}

type Phase = "countdown" | "playing";

const COUNTDOWN_MS = 3_000;
const SAMPLE_INTERVAL_MS = 33; // ~30 Hz
const OFF_TARGET_THRESHOLD = 0.18; // normalized distance (slightly more tolerant)

function euclidean(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function OcularPursuitGame({
  pathSeed,
  gaze,
  durationMs,
  onComplete,
}: OcularPursuitGameProps) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [offTarget, setOffTarget] = useState(false);

  const startedAtRef = useRef(0);
  const samplesRef = useRef<OcularSample[]>([]);
  const gazeRef = useRef<GazePoint | null>(null);

  // Keep gazeRef current without re-registering the sample interval on every tick
  useEffect(() => {
    gazeRef.current = gaze;
  }, [gaze]);

  // Countdown → Playing
  useEffect(() => {
    if (phase !== "countdown") return;
    const started = performance.now();
    let raf: number;
    const tick = () => {
      const t = performance.now() - started;
      const remaining = Math.ceil((COUNTDOWN_MS - t) / 1000);
      setCountdown(Math.max(0, remaining));
      if (t >= COUNTDOWN_MS) {
        startedAtRef.current = performance.now();
        setPhase("playing");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Main game loop — animate target + track elapsed
  useEffect(() => {
    if (phase !== "playing") return;
    let raf: number;
    const loop = () => {
      const t = performance.now() - startedAtRef.current;
      setElapsed(t);
      if (t >= durationMs) {
        onComplete(samplesRef.current);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, durationMs, onComplete]);

  // Independent 30Hz sampler — pushes to ref buffer (no re-renders)
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      const t = performance.now() - startedAtRef.current;
      if (t < 0 || t > durationMs) return;
      const g = gazeRef.current;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      samplesRef.current.push({
        t,
        gx: g ? g.x / vw : null,
        gy: g ? g.y / vh : null,
      });
    }, SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase, durationMs]);

  // Live off-target detection for gaze dot coloring
  useEffect(() => {
    if (phase !== "playing" || !gaze) {
      setOffTarget(false);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tgt = targetAt(elapsed, pathSeed);
    const d = euclidean(gaze.x / vw, gaze.y / vh, tgt.x, tgt.y);
    setOffTarget(d > OFF_TARGET_THRESHOLD);
  }, [gaze, elapsed, pathSeed, phase]);

  const target = targetAt(elapsed, pathSeed);
  const secondsLeft = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
  const progress = Math.min(1, elapsed / durationMs);

  return (
    <div className="fixed inset-0 bg-safegate-bg">
      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-safegate-bg/95"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
              Prepare to follow the dot
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
                className="font-mono text-9xl font-bold text-safegate-primary drop-shadow-[0_0_24px_rgba(34,211,238,0.6)]"
              >
                {countdown > 0 ? countdown : "GO"}
              </motion.span>
            </AnimatePresence>
            <p className="text-sm text-slate-400">Eyes only — keep your head still.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD: countdown + progress arc */}
      {phase === "playing" && (
        <>
          <div className="pointer-events-none absolute left-6 top-6 z-30">
            <ProgressArc progress={progress} label={secondsLeft} />
          </div>

          <div className="pointer-events-none absolute right-6 top-6 z-30 flex items-center gap-2 rounded-xl border border-slate-800 bg-safegate-surface/70 px-3 py-2 text-xs font-medium backdrop-blur">
            {gaze ? (
              <>
                <Eye className="h-4 w-4 text-safegate-success" />
                <span className="text-slate-300">Tracking</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-safegate-warning" />
                <span className="text-safegate-warning">Gaze lost</span>
              </>
            )}
          </div>

          {/* Privacy footer badge */}
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-slate-600">
            Webcam stays on-device · only gaze coordinates leave
          </p>
        </>
      )}

      {/* Target dot */}
      {phase === "playing" && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${target.x * 100}%`,
            top: `${target.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative h-24 w-24">
            <span className="absolute inset-0 rounded-full bg-safegate-primary/30 blur-xl" />
            <span className="absolute inset-[18px] rounded-full bg-safegate-primary shadow-glow animate-pulse-glow" />
          </div>
        </div>
      )}

      {/* Live gaze indicator */}
      {phase === "playing" && <GazeDot gaze={gaze} offTarget={offTarget} />}
    </div>
  );
}

// ─────────── Countdown progress arc ───────────
function ProgressArc({ progress, label }: { progress: number; label: number }) {
  const size = 56;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(51 65 85)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(34 211 238)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-100 ease-linear")}
          style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.5))" }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold text-slate-50 tabular-nums">
        {label}
      </span>
    </div>
  );
}
