"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GameHeader } from "@/components/game-header";
import { OcularPursuitGame } from "@/components/ocular-pursuit-game";
import { WebGazerCalibration } from "@/components/webgazer-calibration";
import { WebGazerPermission } from "@/components/webgazer-permission";
import { submitOcularGame } from "@/lib/api";
import { completeGame } from "@/lib/game-flow";
import { newPathSeed } from "@/lib/ocular-path";
import { useWebEyeTrack } from "@/lib/use-web-eye-track";
import type { OcularSample } from "@/lib/types";

type Phase = "permission" | "calibrate" | "play" | "submitting" | "error";

const DURATION_MS = 10_000;

export default function OcularGamePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [phase, setPhase] = useState<Phase>("permission");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pathSeed = useMemo(() => newPathSeed(), []);
  const startedAtRef = useRef(Date.now());

  const {
    status,
    error: gazerError,
    gaze,
    init,
    teardown,
    recordCalibrationClick,
  } = useWebEyeTrack();

  // Abort if the tab is backgrounded mid-play — samples would be garbage.
  useEffect(() => {
    if (phase !== "play") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setPhase("error");
        setSubmitError("Game aborted — tab was hidden. Please try again.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  const skipToSwipe = useCallback(() => {
    teardown().finally(() => router.replace(`/swipe`));
  }, [router, sessionId, teardown]);

  const handleEnableCamera = useCallback(async () => {
    try {
      await init();
      setPhase("calibrate");
    } catch {
      // error surfaced via hook state; user can then click "Skip"
    }
  }, [init]);

  const handleCalibrationComplete = useCallback(() => {
    startedAtRef.current = Date.now();
    setPhase("play");
  }, []);

  const handleGameComplete = useCallback(
    async (samples: OcularSample[]) => {
      setPhase("submitting");
      setSubmitError(null);
      try {
        const result = await submitOcularGame({
          sessionId,
          pathSeed,
          startedAt: startedAtRef.current,
          durationMs: DURATION_MS,
          samples,
        });
        await teardown();
        await completeGame(result.score, "/ocular", router);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Submission failed";
        setSubmitError(msg);
        setPhase("error");
      }
    },
    [sessionId, pathSeed, teardown, router],
  );

  // ────────── Render per phase ──────────

  if (phase === "permission") {
    return (
      <div className="flex min-h-screen flex-col">
        <GameHeader title="Ocular Pursuit" progress={{ current: 1, total: 3 }} />
        <main className="flex flex-1 items-center justify-center py-10">
          <WebGazerPermission
            loading={status === "loading"}
            error={gazerError}
            onEnable={handleEnableCamera}
            onSkip={skipToSwipe}
          />
        </main>
      </div>
    );
  }

  if (phase === "calibrate") {
    return (
      <div className="min-h-screen">
        <GameHeader title="Calibration" progress={{ current: 1, total: 3 }} />
        <WebGazerCalibration
          onCalibrationClick={recordCalibrationClick}
          onComplete={handleCalibrationComplete}
          gaze={gaze}
        />
      </div>
    );
  }

  if (phase === "play") {
    return (
      <OcularPursuitGame
        pathSeed={pathSeed}
        gaze={gaze}
        durationMs={DURATION_MS}
        onComplete={handleGameComplete}
      />
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-safegate-primary border-t-transparent shadow-glow" />
        <p className="font-mono text-sm text-slate-400">Scoring your pursuit...</p>
      </div>
    );
  }

  // phase === "error"
  return (
    <div className="flex min-h-screen flex-col">
      <GameHeader title="Ocular Pursuit" progress={{ current: 1, total: 3 }} />
      <main className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-safegate-danger/40 bg-safegate-danger/10 p-6 text-center"
        >
          <p className="text-lg font-semibold text-slate-50">Something went wrong</p>
          <p className="text-sm text-slate-400">{submitError ?? "Unknown error"}</p>
          <div className="flex w-full flex-col gap-2">
            <button
              onClick={() => {
                setPhase("permission");
                setSubmitError(null);
              }}
              className="rounded-xl border border-slate-800 bg-safegate-surface px-4 py-3 text-sm font-semibold text-slate-50 hover:border-safegate-primary/60"
            >
              Try Again
            </button>
            <button
              onClick={skipToSwipe}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-50"
            >
              Skip to Decision Speed
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
