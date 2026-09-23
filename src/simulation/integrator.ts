import { derivatives } from './models'
import type { StateVector } from './models'
import type { ReactorConfig, SimPoint, SimulationResult } from './types'

function addScaled(a: StateVector, b: StateVector, scale: number): StateVector {
  return [a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale, a[3] + b[3] * scale]
}

/**
 * Advances the state by one classical 4th-order Runge-Kutta step.
 * RK4 is used instead of simple Euler integration because the Monod term
 * is nonlinear and can change quickly near substrate depletion or CSTR
 * washout; RK4 stays accurate at reasonably large time steps without the
 * cost of a full adaptive solver.
 */
function rk4Step(state: StateVector, dt: number, config: ReactorConfig): StateVector {
  const k1 = derivatives(state, config).state
  const k2 = derivatives(addScaled(state, k1, dt / 2), config).state
  const k3 = derivatives(addScaled(state, k2, dt / 2), config).state
  const k4 = derivatives(addScaled(state, k3, dt), config).state

  return [
    state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    state[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ]
}

/** Practical ceiling so a mistyped duration/dt can't hang the browser tab. */
const MAX_STEPS = 200_000

/** Raised when a run cannot be completed or produces non-physical numbers. */
export class SimulationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SimulationError'
  }
}

/**
 * Runs the full simulation deterministically, up front, from t=0 to
 * t=duration. Precomputing the whole trajectory (rather than integrating
 * live, frame by frame) keeps the result reproducible regardless of the
 * viewer's frame rate, and lets "playback speed" simply control how fast
 * the UI reveals already-known data.
 *
 * Throws SimulationError if the inputs are not finite/positive or if the
 * integration produces NaN/Infinity, so bad numbers never reach the UI.
 */
export function runSimulation(config: ReactorConfig): SimulationResult {
  const { duration, dt } = config.settings
  if (!Number.isFinite(duration) || !Number.isFinite(dt) || duration <= 0 || dt <= 0) {
    throw new SimulationError('Duration and time step must be positive numbers.')
  }
  const { X0, S0, P0, V0 } = config.initial
  if (![X0, S0, P0, V0].every(Number.isFinite) || V0 <= 0) {
    throw new SimulationError('Initial conditions must be finite numbers and the volume must be positive.')
  }
  const k = config.kinetics
  if (![k.muMax, k.Ks, k.Yxs, k.Yps, k.alpha, k.beta, k.ms, k.kd].every(Number.isFinite) || k.Ks <= 0 || k.Yxs <= 0 || k.Yps <= 0) {
    throw new SimulationError('Kinetic parameters must be finite; Ks, Yxs and Yps must be greater than zero.')
  }

  // Keep the whole requested duration even when the step count is capped.
  const nSteps = Math.min(Math.ceil(duration / Math.max(dt, 1e-4)), MAX_STEPS)
  const safeDt = duration / nSteps

  let state: StateVector = [X0, S0, P0, V0]

  const points: SimPoint[] = []
  const pushPoint = (t: number, s: StateVector) => {
    const mu = derivatives(s, config).mu
    points.push({
      t,
      X: Math.max(s[0], 0),
      S: Math.max(s[1], 0),
      P: Math.max(s[2], 0),
      V: Math.max(s[3], 0),
      mu,
    })
  }

  pushPoint(0, state)
  for (let i = 1; i <= nSteps; i++) {
    state = rk4Step(state, safeDt, config)
    if (!state.every(Number.isFinite)) {
      throw new SimulationError(
        `The solver produced a non-finite value at t ≈ ${(i * safeDt).toFixed(2)} h. Try a smaller time step or less extreme parameters.`
      )
    }
    // Numerical guard: biomass/substrate/product/volume cannot go negative.
    state = [
      Math.max(state[0], 0),
      Math.max(state[1], 0),
      Math.max(state[2], 0),
      Math.max(state[3], 0),
    ]
    pushPoint(i * safeDt, state)
  }

  return { points, config }
}

/**
 * Downsamples a trajectory to at most `maxPoints` points for smooth
 * charting/playback without dropping the first or last sample.
 */
export function downsample(points: SimPoint[], maxPoints: number): SimPoint[] {
  if (points.length <= maxPoints) return points
  const stride = Math.ceil(points.length / maxPoints)
  const result: SimPoint[] = []
  for (let i = 0; i < points.length; i += stride) result.push(points[i])
  const last = points[points.length - 1]
  if (result[result.length - 1] !== last) result.push(last)
  return result
}
