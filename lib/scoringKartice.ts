import type { ScoreReport, StroopMetrics, TierStatus, TrialResult } from "./typesKartice";

/**
 * SafeGate scoring — Kartice Boja (STROOP, match/mismatch variant).
 *
 * Reference formula (start_2.md §5):
 *   S = (Accuracy * 0.7) + (LatencyNorm * 0.3)
 *
 *   Tier 1 — APPROVED:      S >= 0.8
 *   Tier 2 — RECALIBRATING: 0.5 <= S < 0.8
 *   Tier 3 — DENIED:        S < 0.5
 *
 * Calibration for binary match/no-match Stroop:
 *
 *   Sober adult — match RT:       ~550 ms
 *                mismatch RT:     ~700 ms
 *                interference:    ~100–200 ms
 *                mismatch accuracy: 95%+
 *
 *   Mildly impaired:
 *                match RT:        ~700 ms
 *                mismatch RT:     ~950 ms
 *                interference:    ~250 ms
 *                mismatch accuracy: ~85–90%
 *
 *   Notably impaired:
 *                match RT:        ~900 ms
 *                mismatch RT:     ~1300+ ms
 *                interference:    400+ ms
 *                mismatch accuracy: < 80%
 */

/* ─────────────────────────────────────────────
   Calibration constants
   ───────────────────────────────────────────── */
const LATENCY_FLOOR_MS = 400;
const LATENCY_IDEAL_MS = 700;
const LATENCY_SLOW_MS = 1100;
const LATENCY_CEILING_MS = 1800;

const INTERFERENCE_LOW_MS = 150;
const INTERFERENCE_HIGH_MS = 450;

/* ─────────────────────────────────────────────
   Metrics aggregation
   ───────────────────────────────────────────── */

export function buildMetrics(trials: TrialResult[]): StroopMetrics {
  const total = trials.length;
  const correct = trials.filter((t) => t.status === "correct");
  const incorrect = trials.filter((t) => t.status === "incorrect");
  const timeouts = trials.filter((t) => t.status === "timeout");

  const correctMatch = correct.filter(
    (t) => t.trial.matches && t.latencyMs !== null,
  );
  const correctMismatch = correct.filter(
    (t) => !t.trial.matches && t.latencyMs !== null,
  );

  const meanLatencyMs = mean(
    correct.map((t) => t.latencyMs).filter((v): v is number => v !== null),
  );
  const meanMatch = mean(correctMatch.map((t) => t.latencyMs!));
  const meanMismatch = mean(correctMismatch.map((t) => t.latencyMs!));

  const interferenceMs =
    meanMatch !== null && meanMismatch !== null
      ? Math.round(meanMismatch - meanMatch)
      : null;

  // Mismatch accuracy — the HARD subset (overriding automatic reading)
  const mismatchTotal = trials.filter((t) => !t.trial.matches).length;
  const mismatchCorrect = correct.filter((t) => !t.trial.matches).length;
  const mismatchAccuracy =
    mismatchTotal > 0 ? mismatchCorrect / mismatchTotal : 0;

  return {
    trials,
    totalTrials: total,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
    timeoutCount: timeouts.length,
    meanLatencyMs,
    meanMatchLatencyMs: meanMatch,
    meanMismatchLatencyMs: meanMismatch,
    interferenceMs,
    mismatchAccuracy,
  };
}

/* ─────────────────────────────────────────────
   Accuracy — weighted: mismatch mistakes hurt more
   ───────────────────────────────────────────── */

/**
 * Accuracy combines overall correctness with a *weighted* penalty for errors
 * on mismatch trials, which are the diagnostically meaningful ones.
 *
 *   overall = correctCount / totalTrials
 *   penalty = (1 - mismatchAccuracy) * 0.15
 *   accuracy = clamp(overall - penalty, 0, 1)
 *
 * A user who gets all match trials right but fails 40% of mismatch trials
 * has their score pulled down extra — that's the Stroop-specific signal.
 */
export function computeAccuracy(m: StroopMetrics): number {
  if (m.totalTrials === 0) return 0;
  const overall = m.correctCount / m.totalTrials;
  const penalty = (1 - m.mismatchAccuracy) * 0.15;
  return clamp01(overall - penalty);
}

/* ─────────────────────────────────────────────
   LatencyNorm — combines raw speed with interference
   ───────────────────────────────────────────── */

/**
 * LatencyNorm blends two signals 50/50:
 *   - raw mean latency (generally slow thinking)
 *   - Stroop interference (specifically degraded impulse control)
 *
 * Raw latency catches a sober-but-tired user. Interference catches specifically
 * impaired cross-dimensional judgment. Both matter for driving safety.
 */
export function computeLatencyNorm(m: StroopMetrics): number {
  if (m.meanLatencyMs === null) return 0;

  const rawNorm = normalizeLatency(m.meanLatencyMs);
  const interferenceNorm =
    m.interferenceMs !== null
      ? normalizeInterference(m.interferenceMs)
      : 0.5; // couldn't measure — don't penalize or credit

  return clamp01(0.5 * rawNorm + 0.5 * interferenceNorm);
}

function normalizeLatency(ms: number): number {
  if (ms <= LATENCY_FLOOR_MS) return 1;
  if (ms >= LATENCY_CEILING_MS) return 0;
  if (ms <= LATENCY_IDEAL_MS) {
    const t = (ms - LATENCY_FLOOR_MS) / (LATENCY_IDEAL_MS - LATENCY_FLOOR_MS);
    return 1 - t * 0.15;
  }
  if (ms <= LATENCY_SLOW_MS) {
    const t = (ms - LATENCY_IDEAL_MS) / (LATENCY_SLOW_MS - LATENCY_IDEAL_MS);
    return 0.85 - t * 0.45;
  }
  const t = (ms - LATENCY_SLOW_MS) / (LATENCY_CEILING_MS - LATENCY_SLOW_MS);
  return 0.4 - t * 0.4;
}

function normalizeInterference(interferenceMs: number): number {
  if (interferenceMs <= INTERFERENCE_LOW_MS) return 1;
  if (interferenceMs >= INTERFERENCE_HIGH_MS) return 0;
  const t =
    (interferenceMs - INTERFERENCE_LOW_MS) /
    (INTERFERENCE_HIGH_MS - INTERFERENCE_LOW_MS);
  return 1 - t;
}

/* ─────────────────────────────────────────────
   Final score & tier
   ───────────────────────────────────────────── */

export function tierFromScore(score: number): TierStatus {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATING";
  return "DENIED";
}

export function scoreRun(m: StroopMetrics): ScoreReport {
  const accuracy = computeAccuracy(m);
  const latencyNorm = computeLatencyNorm(m);
  const score = clamp01(accuracy * 0.7 + latencyNorm * 0.3);
  return {
    accuracy,
    latencyNorm,
    score,
    tier: tierFromScore(score),
  };
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function mean(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
