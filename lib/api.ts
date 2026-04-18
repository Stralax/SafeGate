import type {
  OcularSubmitPayload,
  OcularSubmitResponse,
  SessionStartResponse,
  SwipeAttempt,
  SwipeSubmitResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Thrown when the user is within their 1-hour post-DENIED cooldown. */
export class CooldownError extends Error {
  unlocksAt: Date;
  constructor(unlocksAt: Date) {
    super("Access denied — cooldown active");
    this.name = "CooldownError";
    this.unlocksAt = unlocksAt;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed: ${res.status} ${detail}`);
  }

  return (await res.json()) as T;
}

export async function startSession(): Promise<SessionStartResponse> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (res.status === 429) {
    const data = await res.json() as { unlocks_at: string };
    throw new CooldownError(new Date(data.unlocks_at));
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`POST /api/sessions failed: ${res.status} ${detail}`);
  }

  const raw = await res.json() as { _id: string; user_id: string };
  return { sessionId: raw._id, userId: raw.user_id };
}

export function submitSwipeGame(
  sessionId: string,
  attempts: SwipeAttempt[],
): Promise<SwipeSubmitResponse> {
  return postJson<SwipeSubmitResponse>("/api/games/swipe/submit", {
    sessionId,
    attempts,
  });
}

export function submitOcularGame(
  payload: OcularSubmitPayload,
): Promise<OcularSubmitResponse> {
  return postJson<OcularSubmitResponse>("/api/games/ocular/submit", payload);
}

export async function finishSession(
  sessionId: string,
  result: "APPROVED" | "RECALIBRATING" | "DENIED",
): Promise<void> {
  await fetch(`${API_URL}/api/sessions/${sessionId}/finish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });
}
