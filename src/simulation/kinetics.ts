import type { KineticParams } from './types'

/**
 * Monod specific growth rate.
 *
 *   mu(S) = mu_max * S / (Ks + S)
 *
 * mu approaches mu_max when S >> Ks (substrate in excess) and falls toward
 * zero as S -> 0 (substrate-limited growth). Guards against negative
 * substrate, which can occur transiently during numerical integration.
 */
export function specificGrowthRate(S: number, k: KineticParams): number {
  const Sclamped = Math.max(S, 0)
  return (k.muMax * Sclamped) / (k.Ks + Sclamped)
}

/**
 * Specific product formation rate using the Luedeking-Piret model, which
 * splits product formation into a growth-associated term (proportional to
 * the growth rate) and a non-growth-associated term (proportional to
 * biomass regardless of whether it is actively growing):
 *
 *   qp = alpha * mu + beta
 */
export function specificProductionRate(mu: number, k: KineticParams): number {
  return k.alpha * mu + k.beta
}

/**
 * Total specific substrate uptake rate: substrate diverted to growth,
 * to product formation, and to maintenance.
 *
 *   qS = mu / Yxs + qp / Yps + ms
 */
export function specificSubstrateUptake(mu: number, k: KineticParams): number {
  return mu / k.Yxs + specificProductionRate(mu, k) / k.Yps + k.ms
}

/**
 * The dilution rate above which a CSTR washes out. In the long run the
 * vessel substrate tends toward the feed concentration Sf, so the best
 * net growth rate the culture can ever reach is mu(Sf) - kd; if D exceeds
 * it, cells leave faster than they can be replaced.
 *
 *   D_crit = mu_max * Sf / (Ks + Sf) - kd
 */
export function criticalDilutionRate(Sf: number, k: KineticParams): number {
  return Math.max((k.muMax * Sf) / (k.Ks + Sf) - k.kd, 0)
}

export interface SteadyState {
  X: number
  S: number
  P: number
}

/**
 * Analytical CSTR steady state (all derivatives = 0). Returns null when
 * D >= D_crit, where the only steady state is complete washout (X = 0).
 *
 *   mu* = D + kd                       (net growth balances dilution)
 *   S*  = Ks (D + kd) / (mu_max - D - kd)
 *   X*  = D (Sf - S*) / qS(mu*)
 *   P*  = qp(mu*) X* / D
 */
export function cstrSteadyState(D: number, Sf: number, k: KineticParams): SteadyState | null {
  const muStar = D + k.kd
  if (D <= 0 || muStar >= k.muMax || D >= criticalDilutionRate(Sf, k)) return null
  const S = (k.Ks * muStar) / (k.muMax - muStar)
  if (S >= Sf) return null
  const X = (D * (Sf - S)) / specificSubstrateUptake(muStar, k)
  const P = (specificProductionRate(muStar, k) * X) / D
  return { X, S, P }
}
