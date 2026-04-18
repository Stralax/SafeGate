import { finishSession } from "./api";

export type GameOutcome = "pass" | "tier2" | "fail";

export const GAME_ROUTES = [
  "/ocular",
  "/swipe",
  "/balans-indikator",
  "/kartice-boja",
  "/maze",
  "/pisanje-unazad",
  "/tajmer-dugme",
] as const;

export type GameRoute = (typeof GAME_ROUTES)[number];

// Maze is binary — you complete it or you don't
const BINARY_GAMES: readonly GameRoute[] = ["/maze"];

export function outcomeFromScore(score: number, route: GameRoute): GameOutcome {
  if ((BINARY_GAMES as readonly string[]).includes(route)) {
    return score >= 0.5 ? "pass" : "fail";
  }
  if (score >= 0.8) return "pass";
  if (score >= 0.5) return "tier2";
  return "fail";
}

function pickRandomGame(exclude: GameRoute): GameRoute {
  const options = GAME_ROUTES.filter((r) => r !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

type Router = { push: (url: string) => void };

export async function completeGame(
  score: number,
  currentRoute: GameRoute,
  router: Router,
): Promise<void> {
  const sessionId = localStorage.getItem("safegate:session_id") ?? "";
  const gameNumber = parseInt(localStorage.getItem("safegate:game_number") ?? "1", 10);
  const outcome = outcomeFromScore(score, currentRoute);

  if (gameNumber === 1) {
    if (outcome === "fail") {
      try { await finishSession(sessionId, "DENIED"); } catch { /* non-blocking */ }
      localStorage.setItem("safegate:session_result", "DENIED");
      localStorage.setItem("safegate:session_score", String(score));
      router.push("/result");
    } else {
      localStorage.setItem("safegate:game1_outcome", outcome);
      localStorage.setItem("safegate:game_number", "2");
      router.push(pickRandomGame(currentRoute));
    }
  } else {
    const game1Outcome = localStorage.getItem("safegate:game1_outcome") as GameOutcome;
    const approved =
      (game1Outcome === "pass" && (outcome === "pass" || outcome === "tier2")) ||
      (game1Outcome === "tier2" && outcome === "pass");
    const finalResult = approved ? "APPROVED" : "DENIED";
    try { await finishSession(sessionId, finalResult); } catch { /* non-blocking */ }
    localStorage.setItem("safegate:session_result", finalResult);
    localStorage.setItem("safegate:session_score", String(score));
    router.push("/result");
  }
}
