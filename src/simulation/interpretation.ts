import { criticalDilutionRate, cstrSteadyState } from './kinetics'
import type { DerivedMetrics, SimulationResult } from './types'

/**
 * Produces a short, deterministic natural-language summary of a
 * simulation run, built from threshold rules applied to the trajectory
 * and metrics. No external AI call is used, so the same inputs always
 * produce the same explanation, and the logic is fully inspectable by a
 * student presenting the tool.
 */
export function interpretRun(result: SimulationResult, metrics: DerivedMetrics): string[] {
  const { points, config } = result
  const first = points[0]
  const last = points[points.length - 1]
  const sentences: string[] = []

  const substrateDepleted = last.S < 0.05 * Math.max(first.S, config.kinetics.Ks)
  const substrateAmple = last.S > 2 * config.kinetics.Ks

  if (config.reactorType === 'batch') {
    if (substrateDepleted) {
      sentences.push(
        'Substrate was consumed almost completely by the end of the run, so growth slowed and biomass leveled off as the culture became substrate-limited (the Monod term approaching zero).'
      )
    } else if (substrateAmple) {
      sentences.push(
        'Substrate remained well above the half-saturation constant (Ks) throughout, so growth stayed close to its maximum rate (mu ≈ mu_max) for most of the run rather than being substrate-limited.'
      )
    } else {
      sentences.push(
        'Substrate declined into the range near Ks by the end of the run, so growth transitioned from close to mu_max toward a substrate-limited regime.'
      )
    }
    if (metrics.maxBiomass > 1.5 * first.X + 1e-6) {
      sentences.push(
        `Biomass grew from ${first.X.toFixed(2)} g/L to a peak of ${metrics.maxBiomass.toFixed(2)} g/L before growth slowed.`
      )
    }
  }

  if (config.reactorType === 'fedbatch') {
    const volumeGrowth = last.V / Math.max(first.V, 1e-9)
    if (volumeGrowth > 1.5) {
      sentences.push(
        `Continuous feeding ${volumeGrowth < 2 ? 'increased' : 'more than doubled'} the working volume (from ${first.V.toFixed(2)} L to ${last.V.toFixed(2)} L), diluting concentrations even as total biomass mass increased.`
      )
    }
    if (config.fedBatch.F > 0) {
      let maxS = 0
      for (const p of points) maxS = Math.max(maxS, p.S)
      if (maxS > 10 * config.kinetics.Ks && maxS > 2 * first.S) {
        sentences.push(
          `Substrate accumulated to a peak of ${maxS.toFixed(1)} g/L: the feed (F·Sf = ${(config.fedBatch.F * config.fedBatch.Sf).toFixed(1)} g/h) initially exceeded what the small culture could consume, so growth stayed near μmax until the biomass caught up.`
        )
      } else if (last.S < config.kinetics.Ks) {
        sentences.push(
          'Substrate stayed below the half-saturation constant (Ks), so growth was feed-limited: the culture consumed substrate as fast as it was supplied and the growth rate was set by the feed, not by μmax.'
        )
      } else {
        sentences.push('Feed and consumption were roughly balanced, keeping substrate from collapsing to zero.')
      }
    }
  }

  if (config.reactorType === 'cstr') {
    const dCrit = criticalDilutionRate(config.cstr.Sf, config.kinetics)
    if (metrics.washedOut) {
      sentences.push(
        `The dilution rate (D = ${config.cstr.D.toFixed(3)} h⁻¹) exceeded the critical washout dilution rate (D_crit ≈ ${dCrit.toFixed(3)} h⁻¹) for this feed concentration, so cells were removed from the vessel faster than they could reproduce and biomass collapsed toward zero — a washout.`
      )
    } else {
      sentences.push(
        `The dilution rate (D = ${config.cstr.D.toFixed(3)} h⁻¹) stayed below the critical washout rate (D_crit ≈ ${dCrit.toFixed(3)} h⁻¹), so the culture settled toward a steady state rather than washing out.`
      )
      const ss = cstrSteadyState(config.cstr.D, config.cstr.Sf, config.kinetics)
      if (ss) {
        sentences.push(
          `Analytical steady state for this D: X* = ${ss.X.toFixed(2)} g/L, S* = ${ss.S.toFixed(2)} g/L, P* = ${ss.P.toFixed(2)} g/L (the simulation converges to these values if run long enough).`
        )
      }
      const tailIdx = Math.max(0, points.length - Math.ceil(points.length * 0.05))
      if (Math.abs(last.X - points[tailIdx].X) < 0.01 * Math.max(last.X, 1e-6)) {
        sentences.push(
          'Biomass, substrate, and product concentrations appear to have reached steady state by the end of the run (values are no longer changing appreciably).'
        )
      }
    }
  }

  if (metrics.finalProduct > 0.01) {
    const growthAssociatedShare =
      config.kinetics.alpha > 0 && config.kinetics.beta > 0
        ? 'both growth-associated and non-growth-associated'
        : config.kinetics.alpha > 0
          ? 'primarily growth-associated'
          : 'primarily non-growth-associated'
    sentences.push(
      `Product formation was ${growthAssociatedShare} in this run, reaching ${metrics.finalProduct.toFixed(2)} g/L by the end.`
    )
  }

  return sentences
}
