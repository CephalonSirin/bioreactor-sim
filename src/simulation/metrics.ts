import { criticalDilutionRate } from './kinetics'
import type { DerivedMetrics, ReactorConfig, RunExtents, RunningMetrics, SimPoint, SimulationResult } from './types'

/** Volumetric flow that actually leaves the vessel (L/h): CSTR only. */
function outflowRate(config: ReactorConfig, p: SimPoint): number {
  return config.reactorType === 'cstr' ? config.cstr.D * p.V : 0
}

/** Dilution rate D = F/V at a trajectory point (1/h); zero for batch. */
export function dilutionRateAt(config: ReactorConfig, p: SimPoint): number {
  if (config.reactorType === 'fedbatch') return p.V > 0 ? config.fedBatch.F / p.V : 0
  if (config.reactorType === 'cstr') return config.cstr.D
  return 0
}

/**
 * Cumulative productivity and yield at every trajectory point, from
 * whole-vessel mass balances (amount = concentration x volume):
 *
 *   biomass formed   = X V - X0 V0 + (biomass washed out)
 *   product formed   = P V - P0 V0 + (product washed out)
 *   substrate used   = S0 V0 + (substrate fed) - S V - (substrate washed out)
 *
 * Outflow terms are integrated with the trapezoid rule (CSTR only), so the
 * numbers stay meaningful when volume or flow changes.
 */
export function runningMetrics(points: SimPoint[], config: ReactorConfig): RunningMetrics {
  const n = points.length
  const productivity = new Array<number>(n).fill(0)
  const yieldXS = new Array<number>(n).fill(0)
  const dilution = new Array<number>(n).fill(0)
  if (n === 0) return { productivity, yield: yieldXS, dilution }

  const first = points[0]
  const feedConc = config.reactorType === 'fedbatch' ? config.fedBatch.Sf : config.cstr.Sf
  const feedRate = (p: SimPoint) =>
    config.reactorType === 'fedbatch' ? config.fedBatch.F : config.reactorType === 'cstr' ? config.cstr.D * p.V : 0

  let outX = 0
  let outP = 0
  let outS = 0
  let fedS = 0
  dilution[0] = dilutionRateAt(config, first)

  for (let i = 1; i < n; i++) {
    const a = points[i - 1]
    const b = points[i]
    const dt = b.t - a.t
    const qa = outflowRate(config, a)
    const qb = outflowRate(config, b)
    outX += 0.5 * (qa * a.X + qb * b.X) * dt
    outP += 0.5 * (qa * a.P + qb * b.P) * dt
    outS += 0.5 * (qa * a.S + qb * b.S) * dt
    fedS += 0.5 * (feedRate(a) + feedRate(b)) * feedConc * dt

    const biomassFormed = Math.max(b.X * b.V - first.X * first.V + outX, 0)
    const substrateUsed = first.S * first.V + fedS - b.S * b.V - outS
    yieldXS[i] = substrateUsed > 1e-9 ? Math.min(biomassFormed / substrateUsed, 10) : 0
    productivity[i] = b.t > 0 ? (b.P * b.V - first.P * first.V + outP) / b.t : 0
    dilution[i] = dilutionRateAt(config, b)
  }
  return { productivity, yield: yieldXS, dilution }
}

/** Maxima and the time of peak biomass, used to scale charts and visuals. */
export function runExtents(points: SimPoint[]): RunExtents {
  const e: RunExtents = { maxX: 0, maxS: 0, maxP: 0, maxV: 0, maxMu: 0, maxMuX: 0, tPeakX: 0, duration: 0 }
  for (const p of points) {
    if (p.X > e.maxX) {
      e.maxX = p.X
      e.tPeakX = p.t
    }
    e.maxS = Math.max(e.maxS, p.S)
    e.maxP = Math.max(e.maxP, p.P)
    e.maxV = Math.max(e.maxV, p.V)
    e.maxMu = Math.max(e.maxMu, p.mu)
    e.maxMuX = Math.max(e.maxMuX, p.mu * p.X)
    e.duration = Math.max(e.duration, p.t)
  }
  return e
}

/** True once a CSTR culture has collapsed to a small fraction of its peak. */
export function isWashedOutAt(config: ReactorConfig, p: SimPoint, extents: RunExtents): boolean {
  return (
    config.reactorType === 'cstr' &&
    extents.maxX > 0 &&
    p.t > extents.tPeakX &&
    p.X < 0.05 * extents.maxX
  )
}

/** Computes summary metrics from a completed trajectory. */
export function computeMetrics(result: SimulationResult): DerivedMetrics {
  const { points, config } = result
  const last = points[points.length - 1]
  const first = points[0]
  const extents = runExtents(points)
  const running = runningMetrics(points, config)

  let washedOut = false
  if (config.reactorType === 'cstr') {
    const dCrit = criticalDilutionRate(config.cstr.Sf, config.kinetics)
    washedOut = config.cstr.D >= dCrit || last.X < 0.02 * Math.max(extents.maxX, first.X, 1e-6)
  }

  return {
    finalBiomass: last.X,
    maxBiomass: extents.maxX,
    finalSubstrate: last.S,
    finalProduct: last.P,
    finalVolume: last.V,
    maxGrowthRate: extents.maxMu,
    productivity: running.productivity[points.length - 1],
    realizedYield: running.yield[points.length - 1],
    washedOut,
  }
}
