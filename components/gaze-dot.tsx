"use client";

import { cn } from "@/lib/utils";

interface GazeDotProps {
  /** Gaze in client pixels. When null, dot is hidden. */
  gaze: { x: number; y: number } | null;
  /** When true, dot renders in amber (off-target). Design.md §4B. */
  offTarget?: boolean;
  /** Lower-opacity variant for use during calibration (less distracting). */
  subtle?: boolean;
}

/**
 * Live gaze indicator — ring-within-a-ring per design.md §4B.
 * Renders fixed to viewport via direct CSS transform (no spring: a spring on
 * top of an already-noisy 30 Hz signal causes perceived "spazzing").
 * Smoothing is applied upstream in useWebGazer via EMA.
 */
export function GazeDot({ gaze, offTarget = false, subtle = false }: GazeDotProps) {
  if (!gaze) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-50 h-12 w-12"
      style={{
        transform: `translate3d(${gaze.x - 24}px, ${gaze.y - 24}px, 0)`,
        willChange: "transform",
        opacity: subtle ? 0.55 : 1,
      }}
    >
      <div className="relative h-full w-full">
        {/* Outer pulse ring — design.md §4B */}
        <span
          className={cn(
            "absolute inset-0 rounded-full border-2 animate-pulse-glow",
            offTarget ? "border-safegate-warning" : "border-safegate-primary",
          )}
          style={{ opacity: 0.6 }}
        />
        {/* Inner ring — hollow so the target remains visible through the dot
            when tracking is accurate (ring-within-a-ring per design.md §4B) */}
        <span
          className={cn(
            "absolute inset-[12px] rounded-full border-2",
            offTarget ? "border-safegate-warning" : "border-safegate-primary",
          )}
          style={{ opacity: 0.9 }}
        />
        {/* High-contrast center pip — stays visible even when the gaze dot
            coincides with a same-color target (fixes "dot disappears on
            target" confusion during pursuit). */}
        <span
          className={cn(
            "absolute inset-[22px] rounded-full",
            offTarget ? "bg-safegate-warning" : "bg-white",
          )}
          style={{ boxShadow: "0 0 6px rgba(255,255,255,0.8)" }}
        />
      </div>
    </div>
  );
}
