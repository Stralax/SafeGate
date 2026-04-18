import { prisma } from "../../../../../src/lib/prisma";
import type {
  SwipeAttempt,
  SwipeGameResult,
  SwipeMetrics,
  SwipeRoundResult,
  SwipeSide,
} from "./swipe.types";

// Scoring constants — tuned against typical Go/No-Go cognitive norms
const ACCURACY_WEIGHT = 0.7;
const LATENCY_WEIGHT = 0.3;
const LATENCY_FLOOR_MS = 300;    // below this is implausibly fast (cheating / sensor jitter)
const LATENCY_CEILING_MS = 1500; // above this maps to latency score of 0
const PASS_THRESHOLD = 0.7;      // minimum combined score to pass (sub-Tier-2 headroom)

function correctSideFor(n: number): SwipeSide {
  return n % 2 === 0 ? "LEFT" : "RIGHT";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scoreAttempts(attempts: SwipeAttempt[]): SwipeMetrics {
  const rounds: SwipeRoundResult[] = attempts.map((a) => {
    const correctSide = correctSideFor(a.number);
    return { ...a, correctSide, correct: a.chosenSide === correctSide };
  });

  const correctCount = rounds.filter((r) => r.correct).length;
  const totalRounds = rounds.length;
  const accuracy = correctCount / totalRounds;

  // Exclude implausibly fast taps from latency avg — they distort the signal
  const validLatencies = rounds
    .filter((r) => r.latencyMs >= LATENCY_FLOOR_MS)
    .map((r) => r.latencyMs);

  const avgLatencyMs =
    validLatencies.length > 0
      ? validLatencies.reduce((sum, l) => sum + l, 0) / validLatencies.length
      : LATENCY_CEILING_MS;

  const latencyNormalized = clamp(
    1 - (avgLatencyMs - LATENCY_FLOOR_MS) / (LATENCY_CEILING_MS - LATENCY_FLOOR_MS),
    0,
    1,
  );

  return { rounds, totalRounds, correctCount, accuracy, avgLatencyMs, latencyNormalized };
}

export async function scoreAndPersistSwipeGame(
  sessionId: string,
  attempts: SwipeAttempt[],
): Promise<SwipeGameResult> {
  const metrics = scoreAttempts(attempts);
  const { accuracy, latencyNormalized } = metrics;

  const score = accuracy * ACCURACY_WEIGHT + latencyNormalized * LATENCY_WEIGHT;
  const passed = score >= PASS_THRESHOLD;

  await prisma.gameResult.create({
    data: {
      sessionId,
      gameType: "SWIPE",
      passed,
      // Cast to satisfy Prisma's InputJsonValue — SwipeRoundResult[] is a valid JSON array
      metrics: JSON.parse(
        JSON.stringify({
          totalRounds: metrics.totalRounds,
          correctCount: metrics.correctCount,
          accuracy: metrics.accuracy,
          avgLatencyMs: metrics.avgLatencyMs,
          latencyNormalized: metrics.latencyNormalized,
          rounds: metrics.rounds,
        }),
      ),
    },
  });

  return { score, passed, metrics };
}
