"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GameHeader } from "@/components/game-header";
import { SwipeCardDeck } from "@/components/swipe-card-deck";
import { submitSwipeGame } from "@/lib/api";
import { completeGame } from "@/lib/game-flow";
import type { SwipeAttempt } from "@/lib/types";

export default function SwipeGamePage() {
  const router = useRouter();
  const sessionId = typeof window !== "undefined"
    ? (localStorage.getItem("safegate:session_id") ?? "")
    : "";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (attempts: SwipeAttempt[]) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSwipeGame(sessionId, attempts);
      await completeGame(result.score, "/swipe", router);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit results");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title="Decision Speed" progress={{ current: 1, total: 3 }} />

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        {submitting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
            <p className="font-mono text-sm text-slate-400">Scoring your session...</p>
          </motion.div>
        ) : (
          <div className="flex w-full flex-col items-center gap-6">
            <p className="max-w-sm text-center text-sm text-slate-400 font-medium">
              Swipe each card — <span className="text-safegate-warning">left if even</span>,{" "}
              <span className="text-safegate-primary">right if odd</span>. Work as fast as
              you can without sacrificing accuracy.
            </p>
            <SwipeCardDeck onComplete={handleComplete} />
          </div>
        )}

        {error && (
          <p className="absolute bottom-6 w-full max-w-md rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-3 text-center text-sm text-safegate-danger">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
