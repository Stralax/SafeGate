/**
 * Indicator physics for Balans Indikator.
 *
 * The indicator is modeled as a mass on a rope with:
 *   - Low damping (friction) — momentum feels organic
 *   - Perlin-like low-frequency drift (smooth pseudo-wind)
 *   - Small stochastic jitter (micro-disturbances)
 *   - User input as instantaneous acceleration (left = -A, right = +A)
 *   - Soft walls at x=0 and x=1 (bounce with energy loss)
 *
 * All positions are normalized: 0 = left end, 1 = right end.
 * The green zone is TARGET_CENTER ± TARGET_HALF_WIDTH.
 */

export const TARGET_CENTER = 0.5;
export const TARGET_HALF_WIDTH = 0.1; // zone is 0.40 → 0.60 (20% of rope)

export interface PhysicsState {
  x: number;         // position 0..1
  v: number;         // velocity (units/s)
  driftPhase: number; // internal clock for drift oscillator
}

export interface PhysicsConfig {
  /** Force magnitude when user holds left/right (units/s²) */
  userForce: number;
  /** Friction coefficient (0 = no damping, 1 = heavy damping per second) */
  damping: number;
  /** Amplitude of background drift force */
  driftAmplitude: number;
  /** Frequency components of the drift (rad/s) */
  driftFreqs: readonly number[];
  /** Per-frame noise magnitude */
  noiseAmplitude: number;
  /** Max absolute velocity — keeps things controllable */
  maxVelocity: number;
}

export const DEFAULT_CONFIG: PhysicsConfig = {
  userForce: 0.9,
  damping: 2.2,
  driftAmplitude: 0.35,
  // Two frequencies summed give more organic, less predictable wandering
  driftFreqs: [0.6, 1.4],
  noiseAmplitude: 0.08,
  maxVelocity: 0.8,
};

export function createInitialState(): PhysicsState {
  return {
    x: TARGET_CENTER,      // Start centered — fair starting condition
    v: 0,
    driftPhase: Math.random() * Math.PI * 2,
  };
}

/**
 * Advance the simulation by dt seconds.
 * Returns a NEW state; does not mutate input.
 *
 * @param s current physics state
 * @param dt timestep in seconds (clamped to 50 ms to survive tab-switches)
 * @param input user input: -1 (left), 0 (none), +1 (right)
 * @param cfg physics config
 */
export function step(
  s: PhysicsState,
  dt: number,
  input: -1 | 0 | 1,
  cfg: PhysicsConfig = DEFAULT_CONFIG,
): PhysicsState {
  // Clamp dt — if the tab was backgrounded we don't want a giant jump
  const dtc = Math.min(dt, 0.05);

  // Sum of low-frequency drift — deterministic given the phase, smooth and bounded
  const t = s.driftPhase;
  let drift = 0;
  for (const freq of cfg.driftFreqs) {
    drift += Math.sin(t * freq) * (cfg.driftAmplitude / cfg.driftFreqs.length);
  }

  // Small per-frame stochastic kick
  const noise = (Math.random() * 2 - 1) * cfg.noiseAmplitude;

  // User input acceleration
  const userAccel = input * cfg.userForce;

  // Integrate: a = drift + noise + user; v += a*dt; damp; clamp; x += v*dt
  let v = s.v + (drift + noise + userAccel) * dtc;
  v -= v * cfg.damping * dtc; // linear damping (viscous friction)
  v = clamp(v, -cfg.maxVelocity, cfg.maxVelocity);

  let x = s.x + v * dtc;

  // Soft walls — bounce with 40% energy retention so bouncing off a wall
  // doesn't make the game more controllable (no free "rest state")
  if (x < 0) {
    x = 0;
    v = Math.abs(v) * 0.4;
  } else if (x > 1) {
    x = 1;
    v = -Math.abs(v) * 0.4;
  }

  return {
    x,
    v,
    driftPhase: s.driftPhase + dtc,
  };
}

export function isOnTarget(x: number): boolean {
  return Math.abs(x - TARGET_CENTER) <= TARGET_HALF_WIDTH;
}

/** Signed distance from zone center, 0..1 */
export function distanceFromCenter(x: number): number {
  return Math.abs(x - TARGET_CENTER);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
