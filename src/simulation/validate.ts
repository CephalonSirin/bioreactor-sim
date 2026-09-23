import { criticalDilutionRate } from './kinetics'
import type { ReactorConfig } from './types'

export interface ConfigWarning {
  level: 'info' | 'warn'
  message: string
}

/**
 * Non-blocking advisories about a configuration. These never stop a run;
 * they explain regimes where the educational model behaves in a way
 * students might not expect (coarse steps, washout, tiny feed, ...).
 */
export function configWarnings(config: ReactorConfig): ConfigWarning[] {
  const out: ConfigWarning[] = []
  const { kinetics: k, settings, reactorType } = config

  if (k.muMax * settings.dt > 0.3) {
    out.push({
      level: 'warn',
      message: `Time step Δt = ${settings.dt} h is coarse relative to μmax (μmax·Δt = ${(k.muMax * settings.dt).toFixed(2)}). Reduce Δt for a more accurate trajectory.`,
    })
  }
  if (reactorType === 'cstr') {
    const dCrit = criticalDilutionRate(config.cstr.Sf, k)
    if (config.cstr.D >= dCrit) {
      out.push({
        level: 'warn',
        message: `D = ${config.cstr.D.toFixed(3)} h⁻¹ is at or above D_crit = ${dCrit.toFixed(3)} h⁻¹ — expect washout.`,
      })
    } else if (config.cstr.D > 0.9 * dCrit) {
      out.push({
        level: 'info',
        message: `D is within 10% of D_crit = ${dCrit.toFixed(3)} h⁻¹ — the culture recovers slowly and steady state is reached late.`,
      })
    }
  }
  if (reactorType === 'fedbatch' && config.fedBatch.F === 0) {
    out.push({ level: 'info', message: 'Feed rate is zero, so this fed-batch run behaves exactly like a batch run.' })
  }
  if (config.initial.S0 === 0 && reactorType === 'batch') {
    out.push({ level: 'info', message: 'No initial substrate: nothing can grow, so biomass will only decay.' })
  }
  return out
}
