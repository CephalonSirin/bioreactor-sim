/**
 * Archive metadata for the prepared experiments in simulation/presets.ts:
 * a stable code, the question each one answers, and the parameters it varies
 * from the default configuration of its reactor mode.
 */
export const EXPERIMENT_CODE: Record<string, string> = {
  'healthy-batch': 'E-01',
  'substrate-limited': 'E-02',
  'fast-growth': 'E-03',
  'high-feed-fedbatch': 'E-04',
  'controlled-fedbatch': 'E-05',
  'low-feed-fedbatch': 'E-06',
  'stable-cstr': 'E-07',
  'cstr-washout': 'E-08',
}

export interface ExperimentMeta {
  objective: string
  /** Math markup of the parameters that differ from the mode's defaults. */
  varied: string[]
}

export const EXPERIMENT_META: Record<string, ExperimentMeta> = {
  'healthy-batch': {
    objective: 'Establish the reference batch growth curve: exponential phase, depletion and plateau.',
    varied: ['reference run'],
  },
  'substrate-limited': {
    objective: 'Show growth held below μ_{max} from the start when S_{0} is comparable to K_{s}.',
    varied: ['S_{0} = 1.5 g/L', 'K_{s} = 2 g/L', 't_{end} = 60 h'],
  },
  'fast-growth': {
    objective: 'Compare a faster organism: same yield, the same ceiling reached sooner.',
    varied: ['μ_{max} = 0.9 h⁻¹', 't_{end} = 20 h'],
  },
  'high-feed-fedbatch': {
    objective: 'Overfeed a small culture and watch substrate accumulate until biomass catches up.',
    varied: ['F = 0.3 L/h', 'S_{0} = 5 g/L'],
  },
  'controlled-fedbatch': {
    objective: 'Match feed to uptake so substrate never accumulates, and exceed the batch biomass.',
    varied: ['F = 0.04 L/h', 'X_{0} = 0.5 g/L', 'S_{0} = 5 g/L', 't_{end} = 50 h'],
  },
  'low-feed-fedbatch': {
    objective: 'Starve the culture so growth is set by the feed rate rather than by μ_{max}.',
    varied: ['F = 0.02 L/h', 'S_{f} = 50 g/L', 'S_{0} = 2 g/L', 't_{end} = 60 h'],
  },
  'stable-cstr': {
    objective: 'Reach a steady state below D_{crit} and check it against the analytical solution.',
    varied: ['D = 0.15 h⁻¹', 'X_{0} = 0.5 g/L', 't_{end} = 80 h'],
  },
  'cstr-washout': {
    objective: 'Run above D_{crit}: cells leave faster than they divide and the culture washes out.',
    varied: ['D = 0.55 h⁻¹', 'X_{0} = 1 g/L', 't_{end} = 30 h'],
  },
}
