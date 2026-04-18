"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Clock } from "lucide-react";

import { UnlockSlider } from "@/components/unlock-slider";
import { startSession, CooldownError } from "@/lib/api";
import { GAME_ROUTES } from "@/lib/game-flow";

function randomGame(): string {
  return GAME_ROUTES[Math.floor(Math.random() * GAME_ROUTES.length)];
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "0m 00s";
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function LandingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Countdown ticker
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => {
      const diff = cooldownUntil.getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(id);
        setCooldownUntil(null);
        setTimeLeft("");
        return;
      }
      setTimeLeft(formatTimeLeft(diff));
    }, 1000);
    // Set immediately so there's no 1s blank before first tick
    setTimeLeft(formatTimeLeft(cooldownUntil.getTime() - Date.now()));
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const handleUnlock = async () => {
    setError(null);
    try {
      const { sessionId } = await startSession();
      // Clear any stale state from a previous session
      localStorage.removeItem("safegate:game1_outcome");
      localStorage.removeItem("safegate:session_result");
      localStorage.removeItem("safegate:session_score");
      localStorage.setItem("safegate:session_id", sessionId);
      localStorage.setItem("safegate:game_number", "1");
      router.push(randomGame());
    } catch (err) {
      if (err instanceof CooldownError) {
        setCooldownUntil(err.unlocksAt);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to start session");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-[80%] rounded-full bg-safegate-primary/10 blur-3xl" />
        <div className={`absolute bottom-10 right-[6%] h-80 w-80 rounded-full blur-3xl ${cooldownUntil ? "bg-safegate-danger/10" : "bg-safegate-success/10"}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex w-full max-w-2xl flex-col items-center gap-8 text-center"
      >
        <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium shadow-glow ${cooldownUntil ? "border-safegate-danger/25 bg-safegate-surface/80 text-safegate-danger" : "border-safegate-primary/25 bg-safegate-surface/80 text-safegate-primary"}`}>
          {cooldownUntil ? <ShieldX className="h-4 w-4" strokeWidth={1.8} /> : <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
          Vehicle Access Gate
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-slate-50 sm:text-6xl">
            SafeGate
          </h1>
          {cooldownUntil ? (
            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">
              Access denied. You may retry after your cooldown expires.
            </p>
          ) : (
            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">
              Slide the lock to start your 60-second cognitive check. No hardware,
              no friction — just proof you&apos;re fit to drive.
            </p>
          )}
        </div>

        {cooldownUntil ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 px-8 py-6"
          >
            <Clock className="h-8 w-8 text-safegate-danger" strokeWidth={1.5} />
            <p className="text-sm font-medium uppercase tracking-widest text-safegate-danger">
              Cooldown Active
            </p>
            <p className="font-mono text-4xl font-bold tabular-nums text-slate-50">
              {timeLeft}
            </p>
            <p className="text-xs text-slate-500">
              You may start a new session once the timer reaches zero.
            </p>
          </motion.div>
        ) : (
          <UnlockSlider onUnlock={handleUnlock} />
        )}

        {error && (
          <p className="w-full max-w-xl rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-sm text-safegate-danger">
            {error}
          </p>
        )}
      </motion.div>
    </main>
  );
}
