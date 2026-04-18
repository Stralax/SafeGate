/**
 * SafeGate — types for the Tajmer Dugme (Reflex) game.
 *
 * Aligned with GameResult schema in start_2.md:
 *   gameType: "TIMER"; metrics: Json; passed: Boolean
 */

export type GamePhase =
  | "idle"        // Pre-game — waiting for user to press start
  | "reflex"      // Running trials
  | "analyzing"   // Brief loading between final trial and result
  | "result";

export type TierStatus = "APPROVED" | "RECALIBRATING" | "DENIED";

/** Status of a single reaction-time trial. */
export type TrialStatus = "valid" | "false-start" | "timeout";

export interface TrialResult {
  /** 0-indexed position in the session */
  index: number;
  /** How long red was shown before turning green (ms) */
  waitMs: number;
  /** Outcome classification */
  status: TrialStatus;
  /** Reaction time in ms — null for invalid trials */
  latencyMs: number | null;
}

/** Aggregate metrics for a full session (N trials) */
export interface ReflexMetrics {
  trials: TrialResult[];
  totalTrials: number;
  validTrials: number;
  falseStarts: number;
  timeouts: number;
  /** Mean latency over valid trials only (null if no valid trials) */
  meanLatencyMs: number | null;
  /** Median — more robust to a single outlier */
  medianLatencyMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
}

/** Computed scoring output — matches the SafeGate algorithm */
export interface ScoreReport {
  /** 0..1 — valid-trial ratio with false-start penalty */
  accuracy: number;
  /** 0..1 — normalized latency (1 = fast reflexes, 0 = slow) */
  latencyNorm: number;
  /** 0..1 — final weighted score: S = accuracy*0.7 + latencyNorm*0.3 */
  score: number;
  /** Derived tier per the Escalation Ladder */
  tier: TierStatus;
}
