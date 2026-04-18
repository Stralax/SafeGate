/**
 * SafeGate — types for the Balans Indikator (Motor Control / Tracking) game.
 *
 * Aligned with GameResult schema in start_2.md:
 *   gameType: "BALANCE"; metrics: Json; passed: Boolean
 *
 * The game is a continuous 1-D tracking task: an indicator drifts along a
 * horizontal rope; the user applies left/right force via buttons to keep
 * it centered in a green target zone.
 */

export type GamePhase =
  | "idle"
  | "countdown"   // 3-2-1 before tracking starts
  | "tracking"    // Active test
  | "analyzing"
  | "result";

export type TierStatus = "APPROVED" | "RECALIBRATING" | "DENIED";

/**
 * A single sampled frame during tracking. We record at ~30 Hz so we can
 * replay or analyze the trajectory post-hoc.
 *
 * Positions are in normalized coordinates: 0 = left end of rope, 1 = right end.
 * The green zone occupies a band around center (typically 0.40–0.60).
 */
export interface TrackSample {
  /** ms since tracking began */
  t: number;
  /** position on the rope, 0..1 */
  x: number;
  /** was this sample inside the green zone? */
  onTarget: boolean;
  /** velocity at this sample (units/sec) */
  v: number;
  /** applied user input at this sample: -1 = left, +1 = right, 0 = none */
  input: -1 | 0 | 1;
}

/** Aggregate metrics for a full tracking run */
export interface BalanceMetrics {
  /** Total duration of the run in ms */
  durationMs: number;
  /** % of time the indicator was inside the green zone, 0..1 */
  timeOnTarget: number;
  /** Mean absolute distance from the center of the zone, 0..1 */
  meanError: number;
  /** Root-mean-square error — punishes big deviations more than small ones */
  rmsError: number;
  /** How often the indicator crossed out of the zone */
  excursions: number;
  /** Number of direction reversals in user input (proxy for jitter/overcorrection) */
  inputReversals: number;
  /** Longest continuous stretch (ms) spent inside the zone */
  longestOnTargetMs: number;
  /** Full sample trace (30 Hz) for server-side replay */
  samples: TrackSample[];
}

/** Computed scoring output — matches the SafeGate algorithm */
export interface ScoreReport {
  /** 0..1 — derived from time-on-target and RMS error */
  accuracy: number;
  /** 0..1 — derived from input smoothness (fewer reversals = better) */
  latencyNorm: number;
  /** 0..1 — final weighted score: S = accuracy*0.7 + latencyNorm*0.3 */
  score: number;
  /** Derived tier per the Escalation Ladder */
  tier: TierStatus;
}
