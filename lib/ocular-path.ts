// Lissajous target path for Game 1 (Prati Tačku / Ocular Pursuit).
// Must stay in sync with src/games/ocular/ocular.service.ts on the backend —
// backend reconstructs identical positions from { t, pathSeed } to recompute metrics.

export const OCULAR_PATH = {
  amplitude: 0.4,
  center: 0.5,
  periodXMs: 8_000,
  periodYMs: 12_000,
} as const;

function phaseFromSeed(seed: number): { phiX: number; phiY: number } {
  const normSeed = Math.abs(seed);
  const phiX = ((normSeed % 997) / 997) * 2 * Math.PI;
  const phiY = (((normSeed * 7) % 983) / 983) * 2 * Math.PI;
  return { phiX, phiY };
}

export interface TargetPosition {
  /** normalized [0,1] — caller maps to pixels */
  x: number;
  y: number;
}

export function targetAt(tMs: number, seed: number): TargetPosition {
  const { phiX, phiY } = phaseFromSeed(seed);
  const wx = (2 * Math.PI) / OCULAR_PATH.periodXMs;
  const wy = (2 * Math.PI) / OCULAR_PATH.periodYMs;
  return {
    x: OCULAR_PATH.center + OCULAR_PATH.amplitude * Math.sin(wx * tMs + phiX),
    y: OCULAR_PATH.center + OCULAR_PATH.amplitude * Math.sin(wy * tMs + phiY),
  };
}

export function newPathSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}
