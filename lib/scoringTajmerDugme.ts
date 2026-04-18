import type { ReflexMetrics, ScoreReport, TierStatus, TrialResult } from "./typesTajmerDugme";

/**
 * SafeGate scoring — Tajmer Dugme (REFLEX / TIMER).
 *
 * Reference formula (start_2.md §5):
 *   S = (Accuracy_avg * 0.7) + (Latency_normalized * 0.3)
 *
 *   Tier 1 — APPROVED:      S >= 0.8
 *   Tier 2 — RECALIBRATING: 0.5 <= S < 0.8
 *   Tier 3 — DENIED:        S < 0.5
 *
 * Calibration (from reaction-time psychometrics literature for simple
 * visual RT):
 *
 *   Sober adult mean RT:     ~230–280 ms
 *   Mildly impaired (BAC ~0.05):  ~300–400 ms
 *   Notably impaired (BAC ~0.08): ~400–600 ms
 *   Severely impaired:       >600 ms
 *
 * Therefore the latency curve is:
 *   <= 150 ms  : suspicious (anticipation) — full credit floor
 *   150–250 ms : elite sober reflex → 1.00 → 0.95
 *   250–400 ms : normal sober range     → 0.95 → 0.70
 *   400–600 ms : concerning              → 0.70 → 0.25
 *   600–1000 ms: impaired                 → 0.25 → 0.00
 *   > 1000 ms  : zero credit
 *
 * Accuracy:
 *   accuracy = validTrials / totalTrials
 *   (false-starts and timeouts are penalized by exclusion from this ratio)
 */

const LATENCY_FLOOR_MS = 150;
const LATENCY_ELITE_MS = 250;
const LATENCY_NORMAL_MS = 400;
const LATENCY_CONCERNING_MS = 600;
const LATENCY_IMPAIRED_MS = 1000;

const MIN_TRIAL_REACTION_MS = 80; // Below this = clicked the moment it turned green by luck / held finger

export function buildMetrics(trials: TrialResult[]): ReflexMetrics {
  const total = trials.length;
  const validTrialLatencies = trials
    .filter((t): t is TrialResult & { latencyMs: number } => t.status === "valid" && t.latencyMs !== null)
    .map((t) => t.latencyMs)
    .sort((a, b) => a - b);

  const validTrials = validTrialLatencies.length;
  const falseStarts = trials.filter((t) => t.status === "false-start").length;
  const timeouts = trials.filter((t) => t.status === "timeout").length;

  const meanLatencyMs =
    validTrials > 0
      ? Math.round(
          validTrialLatencies.reduce((sum, v) => sum + v, 0) / validTrials,
        )
      : null;

  const medianLatencyMs =
    validTrials > 0
      ? Math.round(validTrialLatencies[Math.floor(validTrials / 2)])
      : null;

  return {
    trials,
    totalTrials: total,
    validTrials,
    falseStarts,
    timeouts,
    meanLatencyMs,
    medianLatencyMs,
    fastestMs: validTrials > 0 ? validTrialLatencies[0] : null,
    slowestMs: validTrials > 0 ? validTrialLatencies[validTrials - 1] : null,
  };
}

export function computeAccuracy(m: ReflexMetrics): number {
  if (m.totalTrials === 0) return 0;
  return m.validTrials / m.totalTrials;
}

export function computeLatencyNorm(meanLatencyMs: number | null): number {
  if (meanLatencyMs === null) return 0;
  if (meanLatencyMs <= LATENCY_FLOOR_MS) return 1;
  if (meanLatencyMs >= LATENCY_IMPAIRED_MS) return 0;

  if (meanLatencyMs <= LATENCY_ELITE_MS) {
    // 150 → 250 : 1.00 → 0.95
    const t = (meanLatencyMs - LATENCY_FLOOR_MS) / (LATENCY_ELITE_MS - LATENCY_FLOOR_MS);
    return clamp01(1 - t * 0.05);
  }
  if (meanLatencyMs <= LATENCY_NORMAL_MS) {
    // 250 → 400 : 0.95 → 0.70
    const t = (meanLatencyMs - LATENCY_ELITE_MS) / (LATENCY_NORMAL_MS - LATENCY_ELITE_MS);
    return clamp01(0.95 - t * 0.25);
  }
  if (meanLatencyMs <= LATENCY_CONCERNING_MS) {
    // 400 → 600 : 0.70 → 0.25
    const t = (meanLatencyMs - LATENCY_NORMAL_MS) / (LATENCY_CONCERNING_MS - LATENCY_NORMAL_MS);
    return clamp01(0.7 - t * 0.45);
  }
  // 600 → 1000 : 0.25 → 0.00
  const t = (meanLatencyMs - LATENCY_CONCERNING_MS) / (LATENCY_IMPAIRED_MS - LATENCY_CONCERNING_MS);
  return clamp01(0.25 - t * 0.25);
}

export function tierFromScore(score: number): TierStatus {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATING";
  return "DENIED";
}

export function scoreRun(m: ReflexMetrics): ScoreReport {
  const accuracy = computeAccuracy(m);
  const latencyNorm = computeLatencyNorm(m.meanLatencyMs);
  const score = clamp01(accuracy * 0.7 + latencyNorm * 0.3);
  return {
    accuracy,
    latencyNorm,
    score,
    tier: tierFromScore(score),
  };
}

/** Generate a random wait time for a trial, uniform on [minMs, maxMs] */
export function randomWaitMs(minMs = 1500, maxMs = 3500): number {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

/** Is a reaction time plausibly human? Used to reject precognition/held-finger cheats. */
export function isHumanlyPlausible(latencyMs: number): boolean {
  return latencyMs >= MIN_TRIAL_REACTION_MS;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
