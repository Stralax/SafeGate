/**
 * 5-letter word pool for Pisanje Unazad.
 *
 * Selection rules:
 *  - Exactly 5 letters
 *  - No diacritics (č, š, ž, ć, đ) — keeps input simple across keyboard layouts
 *  - Common, recognizable across SI/HR/RS target markets
 *  - No offensive, medical, or alarming words (this runs on possibly impaired users)
 */
export const WORD_POOL: readonly string[] = [
  "MOTOR",
  "PLANE",
  "ROADS",  
  "WHEEL",
  "ZEBRA",
  "OCEAN",
  "TREES", 
  "GRASS",
  "STONE",
  "FIELD",
  "BEARD",
  "HEADS",
  "SOLAR",
  "MONTH",
  "ROBOT",
  "LASER",
  "TIGER",
  "HOTEL",
  "METER",
  "VIDEO",
  "LETTE"    // trimmed from LETTER (better option below)
];
/**
 * Pick a uniformly random word from the pool.
 * Accepts an optional excluded word so consecutive rounds don't repeat.
 */
export function pickRandomWord(exclude?: string): string {
  const pool = exclude
    ? WORD_POOL.filter((w) => w !== exclude)
    : WORD_POOL;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/** Reverse a string. Used for the expected answer and for scoring. */
export function reverseWord(word: string): string {
  return word.split("").reverse().join("");
}
