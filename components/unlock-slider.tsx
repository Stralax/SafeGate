"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Lock, LockOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface UnlockSliderProps {
  onUnlock?: () => void;
  lockedLabel?: string;
  unlockedLabel?: string;
  className?: string;
}

const HANDLE_SIZE = 72;
const TRACK_PADDING = 6;
const COMPLETE_RATIO = 0.82;
const springTransition = { type: "spring", stiffness: 320, damping: 32 } as const;

export function UnlockSlider({
  onUnlock,
  lockedLabel = "Slide to unlock",
  unlockedLabel = "Vehicle unlocked",
  className,
}: UnlockSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const unlockedRef = useRef(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dragLimit, setDragLimit] = useState(0);

  const x = useMotionValue(0);
  const fillWidth = useTransform(
    x,
    (latest) => latest + HANDLE_SIZE + TRACK_PADDING * 2,
  );
  const progress = useTransform(x, (latest) =>
    dragLimit <= 0 ? 0 : latest / dragLimit,
  );
  const hintOpacity = useTransform(progress, [0, 1], [0.9, 0]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const updateLimit = () => {
      const nextLimit = Math.max(
        node.offsetWidth - HANDLE_SIZE - TRACK_PADDING * 2,
        0,
      );
      setDragLimit((current) => (current === nextLimit ? current : nextLimit));
    };

    updateLimit();

    const observer = new ResizeObserver(updateLimit);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = animate(x, isUnlocked ? dragLimit : 0, springTransition);
    return () => controls.stop();
  }, [dragLimit, isUnlocked, x]);

  const completeUnlock = () => {
    if (unlockedRef.current) return;

    unlockedRef.current = true;
    setIsUnlocked(true);
    onUnlock?.();
  };

  const handleDragEnd = () => {
    if (isUnlocked || dragLimit <= 0) return;

    if (x.get() >= dragLimit * COMPLETE_RATIO) {
      completeUnlock();
      return;
    }

    animate(x, 0, springTransition);
  };

  return (
    <section className={cn("w-full max-w-xl space-y-4", className)}>
      <div
        ref={trackRef}
        className={cn(
          "relative h-24 overflow-hidden rounded-full border bg-safegate-surface/80 p-1.5 shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur",
          isUnlocked ? "border-safegate-success/60" : "border-slate-800/80",
        )}
      >
        <motion.div
          aria-hidden
          style={{ width: fillWidth }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            isUnlocked
              ? "bg-gradient-to-r from-safegate-success/40 via-safegate-success/20 to-transparent"
              : "bg-gradient-to-r from-safegate-primary/30 via-safegate-primary/10 to-transparent",
          )}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-16 sm:px-24">
          <motion.span
            animate={{ opacity: 1, scale: isUnlocked ? 1.01 : 1 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "whitespace-nowrap text-center text-xs font-semibold uppercase tracking-[0.18em] sm:text-base sm:tracking-[0.24em]",
              isUnlocked ? "text-emerald-200" : "text-slate-200",
            )}
          >
            {isUnlocked ? unlockedLabel : lockedLabel}
          </motion.span>
        </div>

        <motion.div
          aria-hidden
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute right-7 top-1/2 hidden -translate-y-1/2 items-center gap-2 text-xs font-medium uppercase tracking-[0.32em] text-slate-500 sm:flex"
        >
          <span>Swipe</span>
          <ArrowRight className="h-4 w-4" />
        </motion.div>

        <motion.button
          type="button"
          drag={isUnlocked ? false : "x"}
          dragConstraints={{ left: 0, right: dragLimit }}
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={cn(
            "absolute left-1.5 top-1.5 z-10 flex h-[72px] w-[72px] cursor-grab items-center justify-center rounded-full border text-safegate-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safegate-primary focus-visible:ring-offset-2 focus-visible:ring-offset-safegate-bg active:cursor-grabbing",
            isUnlocked
              ? "border-safegate-success bg-safegate-success shadow-[0_0_32px_rgba(16,185,129,0.35)]"
              : "border-safegate-primary bg-safegate-primary shadow-[0_0_30px_rgba(34,211,238,0.25)]",
          )}
          aria-label={isUnlocked ? unlockedLabel : lockedLabel}
        >
          {isUnlocked ? (
            <LockOpen className="h-7 w-7" strokeWidth={2} />
          ) : (
            <Lock className="h-7 w-7" strokeWidth={2} />
          )}
        </motion.button>
      </div>

      <div className="flex items-center justify-between px-2 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full shadow-[0_0_16px_currentColor]",
              isUnlocked
                ? "bg-safegate-success text-safegate-success"
                : "bg-safegate-primary text-safegate-primary",
            )}
          />
          <span>{isUnlocked ? "Unlock ready" : "Locked"}</span>
        </div>

        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
          {isUnlocked ? "Standby" : "Drag right"}
        </span>
      </div>
    </section>
  );
}
