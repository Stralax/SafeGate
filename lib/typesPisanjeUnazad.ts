/**
 * SafeGate — shared types for the Pisanje Unazad game.
 *
 * Aligned with the GameResult schema in start_2.md:
 *   model GameResult { gameType: "REVERSE_TYPE"; metrics: Json; passed: Boolean }
 */

export type GamePhase =
  | "idle"        // Pre-game — waiting for user to press start
  | "memorize"    // Word visible; user must memorize it
  | "recall"      // Word hidden; user types it reversed
  | "analyzing"   // Brief loading between submit and result
  | "result";     // Tier feedback shown

export type TierStatus = "APPROVED" | "RECALIBRATING" | "DENIED";

/** Raw metrics we capture during a run */
export interface ReverseTypeMetrics {
  /** The word that was shown */
  word: string;
  /** The user's typed answer */
  answer: string;
  /** The correct reversed target */
  target: string;
  /** ms from word-hidden -> final keystroke */
  latencyMs: number;
  /** how many backspaces the user hit */
  corrections: number;
  /** characters matched in position (0..5) */
  matched: number;
  /** true iff answer === target */
  perfect: boolean;
}

/** Computed scoring output — matches the SafeGate algorithm */
export interface ScoreReport {
  /** 0..1 — character-level accuracy */
  accuracy: number;
  /** 0..1 — normalized latency (1 = fast, 0 = slow) */
  latencyNorm: number;
  /** 0..1 — final weighted score: S = accuracy*0.7 + latencyNorm*0.3 */
  score: number;
  /** derived tier per the Escalation Ladder */
  tier: TierStatus;
}
