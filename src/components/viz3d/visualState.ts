import { clamp } from '../../lib/format'
import { isWashedOutAt } from '../../simulation/metrics'
import type { ReactorConfig, ReactorType, RunExtents, SimPoint } from '../../simulation/types'

/**
 * Maps one simulated state to the numbers the 3D reactor draws. Pure and
 * framework-free: the scene only damps toward these targets, so every
 * visual quantity is a function of the same trajectory point the charts
 * and metric cards show.
 *
 *   level        <- V (fed-batch rises toward the run's maximum volume)
 *   turbidity    <- X on an absolute scale, 1 - exp(-X/3)
 *   cells        <- X (same scale as turbidity)
 *   substrate    <- S relative to its peak in the run
 *   product      <- P relative to its peak in the run
 *   gas          <- constant aeration + metabolic gas ~ mu*X
 *   feed/outflow <- F (fed-batch) or D*V (CSTR)
 *   feed bottle  <- volume fed so far; harvest bottle <- volume removed
 */

export type CulturePhase =
  | 'initial'
  | 'growth'
  | 'limited'
  | 'stationary'
  | 'steady'
  | 'approach'
  | 'dilution'
  | 'washout'

export interface VisualTargets {
  /** Liquid height as a fraction of the vessel's inner height. */
  level: number
  turbidity: number
  cells: number
  substrate: number
  product: number
  /** 0..1 gas evolution relative to the run's peak mu*X. */
  gas: number
  /** mu / mu_max: how biologically active the culture currently is. */
  activity: number
  feed: number
  outflow: number
  /** Feed reservoir fill fraction. */
  bottle: number
  /** Harvest vessel fill fraction (CSTR). */
  harvest: number
  washout: number
  /** Culture colour, linear-ish 0..1 RGB. */
  color: [number, number, number]
}

export interface VisualSnapshot {
  targets: VisualTargets
  point: SimPoint
  phase: CulturePhase
  washedOut: boolean
  reactorType: ReactorType
  /** Volumetric flows in L/h (in = feed, out = effluent). */
  flowIn: number
  flowOut: number
}

const MEDIUM: [number, number, number] = [0.3, 0.6, 0.58]
const CULTURE: [number, number, number] = [0.84, 0.58, 0.18]

export const PHASE_LABEL: Record<CulturePhase, string> = {
  initial: 'Initial conditions',
  growth: 'Exponential growth',
  limited: 'Substrate-limited growth',
  stationary: 'Substrate exhausted',
  steady: 'Steady state',
  approach: 'Approaching steady state',
  dilution: 'Dilution exceeds growth',
  washout: 'Washout',
}

export function idleExtents(config: ReactorConfig): RunExtents {
  const V0 = config.initial.V0
  return {
    maxX: config.initial.X0,
    maxS: Math.max(config.initial.S0, 1e-6),
    maxP: 1,
    maxV: config.reactorType === 'fedbatch' ? V0 + config.fedBatch.F * config.settings.duration : V0,
    maxMu: 0,
    maxMuX: 1,
    tPeakX: 0,
    duration: config.settings.duration,
  }
}

function classify(config: ReactorConfig, p: SimPoint, washedOut: boolean, hasRun: boolean): CulturePhase {
  if (!hasRun) return 'initial'
  if (washedOut) return 'washout'
  const k = config.kinetics
  const net = p.mu - k.kd
  if (config.reactorType === 'cstr') {
    const D = config.cstr.D
    if (Math.abs(net - D) <= 0.04 * Math.max(D, 0.02)) return 'steady'
    return net > D ? 'approach' : 'dilution'
  }
  if (p.mu >= 0.7 * k.muMax) return 'growth'
  if (net > 0.02 * k.muMax) return 'limited'
  return 'stationary'
}

export function visualSnapshot(
  point: SimPoint | null,
  config: ReactorConfig,
  extents: RunExtents | null
): VisualSnapshot {
  const { reactorType } = config
  const hasRun = point !== null && extents !== null
  const p: SimPoint = point ?? { t: 0, X: config.initial.X0, S: config.initial.S0, P: config.initial.P0, V: config.initial.V0, mu: 0 }
  const ext = extents ?? idleExtents(config)
  const V0 = config.initial.V0

  // Same framing as the 2D drawing: fed-batch leaves headroom for the
  // whole run's volume; batch/CSTR sit at a constant two-thirds fill.
  const cap = reactorType === 'fedbatch' ? Math.max(ext.maxV, V0, 1e-6) / 0.88 : p.V / 0.66
  const level = clamp(p.V / cap, 0.08, 0.95)

  const turbidity = 1 - Math.exp(-Math.max(p.X, 0) / 3)
  const gas = ext.maxMuX > 0 ? clamp((p.mu * p.X) / ext.maxMuX, 0, 1) : 0
  const washedOut = hasRun && isWashedOutAt(config, p, ext)

  const flowIn = reactorType === 'fedbatch' ? config.fedBatch.F : reactorType === 'cstr' ? config.cstr.D * p.V : 0
  const flowOut = reactorType === 'cstr' ? config.cstr.D * p.V : 0
  const feed = reactorType === 'fedbatch' ? clamp(config.fedBatch.F / 0.4, 0.08, 1) : reactorType === 'cstr' ? clamp(config.cstr.D / 0.6, 0.08, 1) : 0
  const outflow = reactorType === 'cstr' ? feed : 0

  // Reservoirs: fed-batch drains with the fed volume; in a CSTR the medium
  // used equals the effluent collected, both D*V*t at constant volume.
  const duration = Math.max(ext.duration || config.settings.duration, 1e-6)
  let bottle = 1
  let harvest = 0
  if (reactorType === 'fedbatch') {
    const fedTotal = Math.max(ext.maxV - V0, 1e-9)
    bottle = 1 - clamp((p.V - V0) / fedTotal, 0, 1) * 0.9
  } else if (reactorType === 'cstr') {
    const k = clamp(p.t / duration, 0, 1)
    bottle = 1 - k * 0.85
    harvest = 0.04 + k * 0.84
  }

  const tc = Math.pow(turbidity, 0.8)
  const color: [number, number, number] = [
    MEDIUM[0] + (CULTURE[0] - MEDIUM[0]) * tc,
    MEDIUM[1] + (CULTURE[1] - MEDIUM[1]) * tc,
    MEDIUM[2] + (CULTURE[2] - MEDIUM[2]) * tc,
  ]

  return {
    targets: {
      level,
      turbidity,
      cells: turbidity,
      substrate: clamp(p.S / Math.max(ext.maxS, 1e-6), 0, 1),
      product: clamp(p.P / Math.max(ext.maxP, 1e-6), 0, 1),
      gas,
      activity: config.kinetics.muMax > 0 ? clamp(p.mu / config.kinetics.muMax, 0, 1) : 0,
      feed,
      outflow,
      bottle,
      harvest,
      washout: washedOut ? 1 : 0,
      color,
    },
    point: p,
    phase: classify(config, p, washedOut, hasRun),
    washedOut,
    reactorType,
    flowIn,
    flowOut,
  }
}
