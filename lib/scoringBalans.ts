import type { BalanceMetrics, ScoreReport, TierStatus, TrackSample } from "./typesBalans";
import { TARGET_CENTER, TARGET_HALF_WIDTH, isOnTarget } from "./physicsBalans";

/**
 * SafeGate scoring — Balans Indikator (BALANCE).
 *
 * Reference formula (start_2.md §5):
 *   S = (Accuracy_avg * 0.7) + (Latency_normalized * 0.3)
 *
 *   Tier 1 — APPROVED:      S >= 0.8
 *   Tier 2 — RECALIBRATING: 0.5 <= S < 0.8
 *   Tier 3 — DENIED:        S < 0.5
 *
 * For this continuous-tracking game, we re-interpret the two sub-scores:
 *   - Accuracy = combined time-on-target + spatial error term
 *                (how well you held the position)
 *   - LatencyNorm = input smoothness term
 *                (how controlled vs. jittery your inputs were)
 *
 * Rationale: alcohol impairs *modulation* of motor output as much as raw
 * reaction speed. A sober user makes a few confident corrections. An
 * impaired user makes many small overcorrections (high reversal count).
 */

/** Aggregate raw samples into the scored metrics shape. */
export function buildMetrics(
  samples: TrackSample[],
  durationMs: number,
): BalanceMetrics {
  if (samples.length === 0) {
    return emptyMetrics(durationMs);
  }

  let onTargetCount = 0;
  let sumError = 0;
  let sumSquaredError = 0;
  let excursions = 0;
  let inputReversals = 0;
  let longestOnTargetMs = 0;
  let currentStreakStart: number | null = null;
  let lastOnTarget: boolean | null = null;
  let lastInput: -1 | 0 | 1 = 0;

  for (const s of samples) {
    const err = Math.abs(s.x - TARGET_CENTER);
    sumError += err;
    sumSquaredError += err * err;

    if (s.onTarget) {
      onTargetCount++;
      if (currentStreakStart === null) currentStreakStart = s.t;
    } else {
      if (currentStreakStart !== null) {
        longestOnTargetMs = Math.max(longestOnTargetMs, s.t - currentStreakStart);
        currentStreakStart = null;
      }
    }

    // Excursion = transition from on-target to off-target
    if (lastOnTarget === true && !s.onTarget) excursions++;
    lastOnTarget = s.onTarget;

    // Reversal = user input flipped sign (ignoring 0 neutrals)
    if (lastInput !== 0 && s.input !== 0 && lastInput !== s.input) {
      inputReversals++;
    }
    if (s.input !== 0) lastInput = s.input;
  }
  // Close out the final streak
  if (currentStreakStart !== null) {
    longestOnTargetMs = Math.max(
      longestOnTargetMs,
      samples[samples.length - 1].t - currentStreakStart,
    );
  }

  return {
    durationMs,
    timeOnTarget: onTargetCount / samples.length,
    meanError: sumError / samples.length,
    rmsError: Math.sqrt(sumSquaredError / samples.length),
    excursions,
    inputReversals,
    longestOnTargetMs: Math.round(longestOnTargetMs),
    samples,
  };
}

/**
 * Accuracy — combines "time on target" with a spatial-error bonus.
 *
 *   base = timeOnTarget                  (0..1)
 *   errorTerm = 1 - min(rmsError / 0.25, 1)  (0..1 — 0.25 is "completely lost")
 *   accuracy = 0.7*base + 0.3*errorTerm
 *
 * Why both? A user who sits exactly on the boundary scores timeOnTarget=0.5
 * and looks similar to someone wildly swinging in and out. The error term
 * distinguishes "almost on target" from "wildly oscillating".
 */
export function computeAccuracy(m: BalanceMetrics): number {
  const base = m.timeOnTarget;
  const errorTerm = 1 - Math.min(m.rmsError / 0.25, 1);
  return clamp01(0.7 * base + 0.3 * errorTerm);
}

/**
 * LatencyNorm — input smoothness. Repurposed from the standard formula
 * because raw latency isn't meaningful in a continuous tracking task.
 *
 * Targets: a smooth sober user averages ~1 reversal per second. An impaired
 * user doubles or triples that because of overcorrection tremor.
 *
 *   reversalsPerSec = inputReversals / (durationMs/1000)
 *   latencyNorm = 1 when <= 1.0 reversals/sec
 *                 → 0 when >= 4.0 reversals/sec (linearly)
 */
export function computeLatencyNorm(m: BalanceMetrics): number {
  if (m.durationMs <= 0) return 0;
  const reversalsPerSec = m.inputReversals / (m.durationMs / 1000);
  if (reversalsPerSec <= 1.0) return 1;
  if (reversalsPerSec >= 4.0) return 0;
  return clamp01(1 - (reversalsPerSec - 1.0) / 3.0);
}

export function tierFromScore(score: number): TierStatus {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATING";
  return "DENIED";
}

export function scoreRun(m: BalanceMetrics): ScoreReport {
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

function emptyMetrics(durationMs: number): BalanceMetrics {
  return {
    durationMs,
    timeOnTarget: 0,
    meanError: TARGET_HALF_WIDTH,
    rmsError: TARGET_HALF_WIDTH,
    excursions: 0,
    inputReversals: 0,
    longestOnTargetMs: 0,
    samples: [],
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Re-export physics constants so components can use them consistently
export { TARGET_CENTER, TARGET_HALF_WIDTH, isOnTarget };
