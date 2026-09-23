import type { KineticParams, ReactorConfig, ReactorType } from './types'

export const BASE_KINETICS: KineticParams = {
  muMax: 0.4,
  Ks: 0.5,
  Yxs: 0.5,
  Yps: 0.3,
  alpha: 0.1,
  beta: 0.02,
  ms: 0.01,
  kd: 0.005,
}

export function defaultConfigFor(reactorType: ReactorType): ReactorConfig {
  return {
    reactorType,
    kinetics: { ...BASE_KINETICS },
    initial: { X0: 0.1, S0: 10, P0: 0, V0: 2 },
    fedBatch: { F: 0.05, Sf: 100 },
    cstr: { D: 0.2, Sf: 20 },
    settings: { duration: 40, dt: 0.02 },
  }
}

export interface Preset {
  id: string
  label: string
  reactorType: ReactorType
  /** One-line summary shown on cards and in the lab. */
  description: string
  /** What the biology/engineering is showing, in B.Sc. language. */
  science: string
  /** What to look for in the reactor, charts and insights. */
  watchFor: string
  build: () => ReactorConfig
}

interface ConfigPatch {
  kinetics?: Partial<KineticParams>
  initial?: Partial<ReactorConfig['initial']>
  fedBatch?: Partial<ReactorConfig['fedBatch']>
  cstr?: Partial<ReactorConfig['cstr']>
  settings?: Partial<ReactorConfig['settings']>
}

const make = (type: ReactorType, patch: ConfigPatch): ReactorConfig => {
  const base = defaultConfigFor(type)
  return {
    reactorType: type,
    kinetics: { ...base.kinetics, ...patch.kinetics },
    initial: { ...base.initial, ...patch.initial },
    fedBatch: { ...base.fedBatch, ...patch.fedBatch },
    cstr: { ...base.cstr, ...patch.cstr },
    settings: { ...base.settings, ...patch.settings },
  }
}

export const PRESETS: Preset[] = [
  {
    id: 'healthy-batch',
    label: 'Healthy Batch Growth',
    reactorType: 'batch',
    description: 'Ample substrate and a moderate μmax give the classic batch growth curve.',
    science:
      'With S₀ far above Ks the culture grows near μmax (exponential phase). Growth only slows when substrate runs low, and biomass levels off close to X₀ + Yxs·S₀, less what maintenance and death consume.',
    watchFor: 'Biomass rising exponentially, then plateauing as substrate reaches zero; μ falling from ≈ μmax to 0.',
    build: () => make('batch', {}),
  },
  {
    id: 'substrate-limited',
    label: 'Substrate Limited',
    reactorType: 'batch',
    description: 'Little starting substrate and a high Ks: growth is starved from the very beginning.',
    science:
      'When S₀ is comparable to Ks, the Monod term S/(Ks+S) stays well below 1, so μ is far under μmax from the start. The final biomass is capped by how much substrate was supplied.',
    watchFor: 'Slow growth, a low biomass ceiling, and substrate that disappears early.',
    build: () => make('batch', { kinetics: { Ks: 2 }, initial: { S0: 1.5 }, settings: { duration: 60 } }),
  },
  {
    id: 'fast-growth',
    label: 'Fast Growth',
    reactorType: 'batch',
    description: 'A high μmax organism consumes the medium and reaches its plateau quickly.',
    science:
      'A larger μmax shortens the doubling time (ln 2 / μ), so the same substrate is used in a fraction of the time. Yield is unchanged, so the biomass ceiling is similar; it is simply reached earlier.',
    watchFor: 'The whole growth curve compressed into the first ~10 hours, with a sharp drop in substrate.',
    build: () => make('batch', { kinetics: { muMax: 0.9 }, settings: { duration: 20, dt: 0.01 } }),
  },
  {
    id: 'high-feed-fedbatch',
    label: 'High Feed Fed-Batch',
    reactorType: 'fedbatch',
    description: 'Feed is supplied faster than the culture can use it, so substrate accumulates.',
    science:
      'The feed delivers substrate at F·Sf g/h. When that exceeds what the biomass can consume, the excess builds up (S rises well above Ks), μ stays near μmax, and the volume grows quickly, diluting concentrations.',
    watchFor: 'Substrate accumulating for the first ~15 h (overfeeding a small culture) until the exponentially growing biomass catches up; volume climbing steeply and concentrations being diluted.',
    build: () => make('fedbatch', { fedBatch: { F: 0.3, Sf: 100 }, initial: { S0: 5 } }),
  },
  {
    id: 'controlled-fedbatch',
    label: 'Controlled Fed-Batch',
    reactorType: 'fedbatch',
    description: 'A moderate feed is taken up as fast as it arrives, so substrate never accumulates.',
    science:
      'With a larger inoculum and a moderate feed, the culture consumes substrate as fast as it is supplied, so it never accumulates. Feeding beyond the initial charge lets the run reach a much higher biomass than a batch with the same starting medium.',
    watchFor: 'Substrate near zero after the first ~10 h, gentle volume rise, and a biomass plateau well above the batch value.',
    build: () => make('fedbatch', { fedBatch: { F: 0.04, Sf: 100 }, initial: { X0: 0.5, S0: 5 }, settings: { duration: 50 } }),
  },
  {
    id: 'low-feed-fedbatch',
    label: 'Low Feed',
    reactorType: 'fedbatch',
    description: 'Very little feed: after the initial charge the culture is starved.',
    science:
      'When supply is below the culture’s capacity, growth becomes feed-limited: substrate stays near zero and the growth rate is set by the feed rate, not by μmax.',
    watchFor: 'Substrate pinned near zero, μ far below μmax, and a slow feed-limited rise in total biomass.',
    build: () => make('fedbatch', { fedBatch: { F: 0.02, Sf: 50 }, initial: { S0: 2 }, settings: { duration: 60 } }),
  },
  {
    id: 'stable-cstr',
    label: 'Stable CSTR',
    reactorType: 'cstr',
    description: 'Dilution rate well below D_crit: the culture settles to a steady state.',
    science:
      'At steady state the net growth rate equals the dilution rate (μ = D + kd). Biomass, substrate and product all stop changing, and the operator sets the growth rate simply by choosing D.',
    watchFor: 'Flat concentration curves after the start-up transient, matching the analytical steady state shown in the insights.',
    build: () => make('cstr', { cstr: { D: 0.15, Sf: 20 }, initial: { X0: 0.5 }, settings: { duration: 80 } }),
  },
  {
    id: 'cstr-washout',
    label: 'CSTR Washout',
    reactorType: 'cstr',
    description: 'Dilution rate above D_crit: cells leave faster than they can reproduce.',
    science:
      'Even at maximum growth (substrate at Sf), μ cannot exceed D_crit = μ(Sf) − kd. If D is larger, biomass falls exponentially, substrate climbs toward the feed value, and the vessel empties of cells.',
    watchFor: 'Biomass collapsing towards zero while substrate rises to Sf, and the vessel visibly clearing.',
    build: () => make('cstr', { cstr: { D: 0.55, Sf: 20 }, initial: { X0: 1 }, settings: { duration: 30 } }),
  },
]

export const PRESETS_BY_REACTOR = (type: ReactorType) => PRESETS.filter((p) => p.reactorType === type)
export const presetById = (id: string) => PRESETS.find((p) => p.id === id)
