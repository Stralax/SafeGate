// Mirrors src/games/swipe/swipe.types.ts on the backend.

export type SwipeSide = "LEFT" | "RIGHT";

export interface SwipeAttempt {
  number: number;
  chosenSide: SwipeSide;
  latencyMs: number;
}

export interface SwipeRoundResult extends SwipeAttempt {
  correctSide: SwipeSide;
  correct: boolean;
}

export interface SwipeMetrics {
  rounds: SwipeRoundResult[];
  totalRounds: number;
  correctCount: number;
  accuracy: number;
  avgLatencyMs: number;
  latencyNormalized: number;
}

export interface SwipeSubmitResponse {
  gameType: "SWIPE";
  sessionId: string;
  passed: boolean;
  score: number;
  metrics: SwipeMetrics;
}

// ───── Ocular (Game 1) — mirrors src/games/ocular/ocular.types.ts ─────

export interface OcularSample {
  t: number;
  gx: number | null;
  gy: number | null;
}

export interface OcularSubmitPayload {
  sessionId: string;
  pathSeed: number;
  startedAt: number;
  durationMs: number;
  samples: OcularSample[];
}

export interface OcularMetrics {
  totalSamples: number;
  validSamples: number;
  nullRatio: number;
  avgDeviation: number;
  accuracy: number;
  saccadeCount: number;
  smoothness: number;
  sampleHz: number;
}

export interface OcularSubmitResponse {
  gameType: "OCULAR";
  sessionId: string;
  passed: boolean;
  score: number;
  metrics: OcularMetrics;
}

export type OcularRejectReason =
  | "SAMPLE_RATE_TOO_LOW"
  | "TOO_MANY_NULL_SAMPLES"
  | "STATIC_GAZE"
  | "DURATION_OUT_OF_RANGE";

export interface SessionStartResponse {
  sessionId: string;
  userId: string;
}

export type Tier = "APPROVED" | "RECALIBRATE" | "DENIED";

// Tier thresholds from documentation.md §2 "Escalation Ladder"
export function tierFromScore(score: number): Tier {
  if (score >= 0.8) return "APPROVED";
  if (score >= 0.5) return "RECALIBRATE";
  return "DENIED";
}
