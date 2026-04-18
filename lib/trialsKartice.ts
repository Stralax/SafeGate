import { ALL_COLORS, type StroopColor, type StroopTrial } from "./typesKartice";

/**
 * Generate N balanced Stroop trials for the binary match/no-match task.
 *
 * Design rules:
 *   1. For 5 trials we split 3 match + 2 mismatch (or 2 + 3 — randomized per run).
 *      This avoids a 50/50 pattern the user can game, while keeping both kinds
 *      represented.
 *   2. No two consecutive trials have the same swatchColor (prevents motor
 *      patterning on the swatch-recognition channel).
 *   3. No two consecutive trials have the same wordColor (same, on the reading
 *      channel).
 *   4. The match/mismatch pattern is shuffled — user never knows which is coming.
 */
export function generateTrials(total: number): StroopTrial[] {
  // Random split — for total=5 this gives either 3/2 or 2/3
  const matchCount =
    Math.random() < 0.5 ? Math.ceil(total / 2) : Math.floor(total / 2);
  const mismatchCount = total - matchCount;

  const trials: StroopTrial[] = [];

  // Match trials — swatch and word share a color
  for (let i = 0; i < matchCount; i++) {
    const color = pickRandom(ALL_COLORS);
    trials.push({
      index: 0,
      swatchColor: color,
      wordColor: color,
      matches: true,
    });
  }

  // Mismatch trials — swatch and word differ
  for (let i = 0; i < mismatchCount; i++) {
    const swatch = pickRandom(ALL_COLORS);
    const word = pickRandom(ALL_COLORS.filter((c) => c !== swatch));
    trials.push({
      index: 0,
      swatchColor: swatch,
      wordColor: word,
      matches: false,
    });
  }

  const shuffled = shuffle(trials);
  const ordered = avoidConsecutiveRepeats(shuffled);

  return ordered.map((t, i) => ({ ...t, index: i }));
}

/** Fisher–Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Try to reorder so no two consecutive trials share a swatchColor OR wordColor.
 * Best-effort — with 5 trials and 4 colors it's essentially always satisfiable.
 */
function avoidConsecutiveRepeats(trials: StroopTrial[]): StroopTrial[] {
  const arr = [...trials];
  for (let pass = 0; pass < 50; pass++) {
    let allOk = true;
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1];
      const cur = arr[i];
      if (prev.swatchColor === cur.swatchColor || prev.wordColor === cur.wordColor) {
        let swapped = false;
        for (let j = i + 1; j < arr.length; j++) {
          const candidate = arr[j];
          const neighborBefore = arr[j - 1];
          const neighborAfter = arr[j + 1];
          const iLegal =
            prev.swatchColor !== candidate.swatchColor &&
            prev.wordColor !== candidate.wordColor;
          const jBeforeLegal =
            j === i + 1 ||
            (neighborBefore.swatchColor !== cur.swatchColor &&
              neighborBefore.wordColor !== cur.wordColor);
          const jAfterLegal =
            !neighborAfter ||
            (neighborAfter.swatchColor !== cur.swatchColor &&
              neighborAfter.wordColor !== cur.wordColor);
          if (iLegal && jBeforeLegal && jAfterLegal) {
            [arr[i], arr[j]] = [arr[j], arr[i]];
            swapped = true;
            break;
          }
        }
        if (!swapped) allOk = false;
      }
    }
    if (allOk) return arr;
  }
  return arr;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
