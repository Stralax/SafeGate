/**
 * SafeGate — types for the Kartice Boja (Stroop Effect) game.
 *
 * Aligned with GameResult schema in start_2.md:
 *   gameType: "STROOP"; metrics: Json; passed: Boolean
 *
 * Task: a colored swatch and a color-name word are shown together on a card.
 * The user answers YES if the swatch color matches the word, NO if it doesn't.
 * Tests prefrontal impulse control — the ability to override the automatic
 * reading response to judge a cross-dimensional match.
 */

export type GamePhase =
  | "idle"
  | "countdown"
  | "trial"
  | "analyzing"
  | "result";

export type TierStatus = "APPROVED" | "RECALIBRATING" | "DENIED";

/**
 * The four color options used in the game.
 * Chosen to be visually distinct on the SafeGate dark background and to
 * avoid colliding with tier colors (emerald/amber/rose/cyan).
 */
export type StroopColor = "magenta" | "blue" | "orange" | "yellow";

export const ALL_COLORS: readonly StroopColor[] = ["magenta", "blue", "orange", "yellow"];

/**
 * Display metadata per color — hex and Slovenian label (primary Avant2go market).
 */
export const COLOR_META: Record<StroopColor, { hex: string; label: string; glow: string }> = {
  magenta: { hex: "#ec4899", label: "Pink",   glow: "0 0 25px rgba(236,72,153,0.4)" },
  blue:    { hex: "#38bdf8", label: "Blue",  glow: "0 0 25px rgba(56,189,248,0.4)" },
  orange:  { hex: "#fb923c", label: "Orange",  glow: "0 0 25px rgba(251,146,60,0.4)" },
  yellow:  { hex: "#facc15", label: "Yellow",  glow: "0 0 25px rgba(250,204,21,0.4)" },
};

/**
 * A single trial: a swatch (colored shape) + a word (color name).
 * If swatchColor === wordColor → correct answer is YES.
 * If they differ → correct answer is NO.
 */
export interface StroopTrial {
  /** 0-indexed trial number */
  index: number;
  /** The color of the colored shape shown on the card */
  swatchColor: StroopColor;
  /** The color NAME displayed as text on the card */
  wordColor: StroopColor;
  /** True iff swatchColor === wordColor (correct answer is YES) */
  matches: boolean;
}

/** The user's binary answer */
export type UserAnswer = "yes" | "no";

/** Outcome of a single trial */
export type TrialStatus = "correct" | "incorrect" | "timeout";

export interface TrialResult {
  trial: StroopTrial;
  status: TrialStatus;
  /** ms from card-shown to answer-tapped — null if timed out */
  latencyMs: number | null;
  /** What the user tapped — null on timeout */
  chosen: UserAnswer | null;
}

export interface StroopMetrics {
  trials: TrialResult[];
  totalTrials: number;
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  /** Among CORRECT trials only */
  meanLatencyMs: number | null;
  /** Mean RT on correct MATCH trials (correctly answered YES) */
  meanMatchLatencyMs: number | null;
  /** Mean RT on correct MISMATCH trials (correctly answered NO) */
  meanMismatchLatencyMs: number | null;
  /**
   * Stroop interference for the binary-judgment variant:
   *   = meanMismatchLatency − meanMatchLatency
   *
   * Mismatch trials require ACTIVELY overriding the automatic reading
   * response to judge the swatch against the word. Sober users take
   * 100–200 ms longer on these. Impaired users take 300+ ms longer AND
   * make more errors on them.
   */
  interferenceMs: number | null;
  /** Accuracy on mismatch trials specifically (the hard subset) */
  mismatchAccuracy: number;
}

export interface ScoreReport {
  accuracy: number;
  latencyNorm: number;
  score: number;
  tier: TierStatus;
}
