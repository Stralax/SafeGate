import type { ReverseTypeMetrics, ScoreReport, TierStatus } from "./typesPisanjeUnazad";

/**
 * SafeGate scoring — Pisanje Unazad (REVERSE_TYPE).
 *
 * Reference formulas (from start_2.md):
 *   S = (Accuracy_avg * 0.7) + (Latency_normalized * 0.3)
 *
 *   Tier 1 — APPROVED:      S >= 0.8
 *   Tier 2 — RECALIBRATING: 0.5 <= S < 0.8
 *   Tier 3 — DENIED:        S < 0.5
 *
 * Calibration for this individual game:
 *   - Accuracy is position-wise character match against the reversed target.
 *     Exact match = 1.0, one char off = 0.8, etc. A small correction-penalty
 *     subtracts for backspace-heavy performance (poor impulse/planning).
 *   - Latency target for a sober user to reverse-type 5 letters: ~4500 ms.
 *     Floor = 2000 ms (no credit faster than 2s for guessing prevention).
 *     Ceiling = 12000 ms (below this earns 0 latency credit).
 */

const LATENCY_IDEAL_MS = 4500;
const LATENCY_FLOOR_MS = 2000;
const LATENCY_CEILING_MS = 12000;

export function computeAccuracy(m: ReverseTypeMetrics): number {
  const base = m.matched / Math.max(m.target.length, 1);
  // Small penalty for excessive corrections (planning/working memory proxy)
  const correctionPenalty = Math.min(m.corrections * 0.05, 0.2);
  return clamp01(base - correctionPenalty);
}

export function computeLatencyNorm(latencyMs: number): number {
  if (latencyMs <= LATENCY_FLOOR_MS) return 1;
  if (latencyMs >= LATENCY_CEILING_MS) return 0;
  if (latencyMs <= LATENCY_IDEAL_MS) {
    // Between floor and ideal → linear 1 → 0.85
    const t = (latencyMs - LATENCY_FLOOR_MS) / (LATENCY_IDEAL_MS - LATENCY_FLOOR_MS);
    return clamp01(1 - t * 0.15);
  }
  // Between ideal and ceiling → linear 0.85 → 0
  const t = (latencyMs - LATENCY_IDEAL_MS) / (LATENCY_CEILING_MS - LATENCY_IDEAL_MS);
  return clamp01(0.85 - t * 0.85);
}

export function tierFromScore(score: number): TierStatus {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATING";
  return "DENIED";
}

export function scoreRun(m: ReverseTypeMetrics): ScoreReport {
  const accuracy = computeAccuracy(m);
  const latencyNorm = computeLatencyNorm(m.latencyMs);
  const score = clamp01(accuracy * 0.7 + latencyNorm * 0.3);
  return {
    accuracy,
    latencyNorm,
    score,
    tier: tierFromScore(score),
  };
}

/** Count how many characters match positionally between two strings. */
export function countMatched(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let n = 0;
  for (let i = 0; i < len; i++) if (a[i] === b[i]) n++;
  return n;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
