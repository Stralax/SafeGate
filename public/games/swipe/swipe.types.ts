export type SwipeSide = "LEFT" | "RIGHT";

export interface SwipeAttempt {
  /** The number shown on the card */
  number: number;
  /** Side the user chose */
  chosenSide: SwipeSide;
  /** Milliseconds from card display to swipe gesture */
  latencyMs: number;
}

export interface SwipeSubmitPayload {
  sessionId: string;
  attempts: SwipeAttempt[];
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

export interface SwipeGameResult {
  score: number;
  passed: boolean;
  metrics: SwipeMetrics;
}
