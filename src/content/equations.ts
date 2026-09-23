import type { ReactorType } from '../simulation/types'

/**
 * Equation text shown in the Lab, Learn and Methodology pages.
 * These mirror src/simulation/kinetics.ts and models.ts exactly; keep them
 * in sync when the model changes. Markup: `_{x}` subscript, `^{x}` superscript.
 */

export const RATE_LAWS = {
  monod: 'μ = μ_{max} S / (K_{s} + S)',
  product: 'q_{p} = α μ + β',
  uptake: 'q_{S} = μ / Y_{x/s} + q_{p} / Y_{p/s} + m_{s}',
} as const

export interface MassBalanceSet {
  title: string
  summary: string
  lines: string[]
  meaning: string[]
}

export const MASS_BALANCES: Record<ReactorType, MassBalanceSet> = {
  batch: {
    title: 'Batch reactor',
    summary: 'Closed system: no inflow, no outflow, constant volume.',
    lines: ['dX/dt = (μ − k_{d}) X', 'dS/dt = − q_{S} X', 'dP/dt = q_{p} X', 'dV/dt = 0'],
    meaning: [
      'Biomass grows at the specific growth rate μ and is lost to cell death at rate k_{d}.',
      'Substrate is only ever consumed: for growth, for making product, and for maintenance.',
      'Product accumulates in proportion to the biomass present.',
      'Nothing enters or leaves, so the volume is fixed.',
    ],
  },
  fedbatch: {
    title: 'Fed-batch reactor',
    summary: 'Feed enters at rate F and nothing leaves, so the volume grows and D = F / V falls with time.',
    lines: ['D = F / V', 'dX/dt = (μ − k_{d} − D) X', 'dS/dt = D (S_{f} − S) − q_{S} X', 'dP/dt = q_{p} X − D P', 'dV/dt = F'],
    meaning: [
      'D is the instantaneous dilution rate, the feed flow divided by the current volume.',
      'Biomass concentration is diluted by the growing volume even though no cells leave.',
      'Substrate is supplied by the feed (S_{f} − S) and consumed by the culture.',
      'Product concentration is diluted in the same way as biomass.',
      'Volume rises linearly at the feed rate.',
    ],
  },
  cstr: {
    title: 'Continuous stirred-tank reactor (CSTR)',
    summary: 'Inflow equals outflow, so the volume is constant and D = F / V is a fixed operating parameter.',
    lines: ['dX/dt = (μ − k_{d} − D) X', 'dS/dt = D (S_{f} − S) − q_{S} X', 'dP/dt = q_{p} X − D P', 'dV/dt = 0'],
    meaning: [
      'Cells are lost by washout at rate D as well as by death; if μ − k_{d} < D the biomass declines.',
      'Fresh medium brings substrate in and the outflow removes what is left.',
      'Product leaves with the outflow at rate D P.',
      'Inflow and outflow balance, so volume stays constant.',
    ],
  },
}

export interface VariableDef {
  symbol: string
  name: string
  unit: string
  meaning: string
  group: 'state' | 'rate' | 'parameter' | 'operating'
}

export const VARIABLES: VariableDef[] = [
  { symbol: 'X', name: 'Biomass concentration', unit: 'g/L', meaning: 'Mass of cells per litre of culture.', group: 'state' },
  { symbol: 'S', name: 'Substrate concentration', unit: 'g/L', meaning: 'Concentration of the single limiting nutrient (for example glucose).', group: 'state' },
  { symbol: 'P', name: 'Product concentration', unit: 'g/L', meaning: 'Concentration of the compound the cells make.', group: 'state' },
  { symbol: 'V', name: 'Working volume', unit: 'L', meaning: 'Volume of liquid in the vessel.', group: 'state' },
  { symbol: 'μ', name: 'Specific growth rate', unit: 'h⁻¹', meaning: 'New biomass per unit biomass per hour; how fast the culture is growing right now.', group: 'rate' },
  { symbol: 'q_{p}', name: 'Specific product formation rate', unit: 'g g⁻¹ h⁻¹', meaning: 'Product made per gram of biomass per hour.', group: 'rate' },
  { symbol: 'q_{S}', name: 'Specific substrate uptake rate', unit: 'g g⁻¹ h⁻¹', meaning: 'Substrate consumed per gram of biomass per hour, for growth, product and maintenance together.', group: 'rate' },
  { symbol: 'μ_{max}', name: 'Maximum specific growth rate', unit: 'h⁻¹', meaning: 'The fastest growth the organism can achieve with unlimited substrate.', group: 'parameter' },
  { symbol: 'K_{s}', name: 'Monod (half-saturation) constant', unit: 'g/L', meaning: 'Substrate concentration at which μ = μ_{max}/2. Small K_{s} means efficient growth at low substrate.', group: 'parameter' },
  { symbol: 'Y_{x/s}', name: 'Biomass yield on substrate', unit: 'g/g', meaning: 'Grams of biomass formed per gram of substrate used for growth.', group: 'parameter' },
  { symbol: 'Y_{p/s}', name: 'Product yield on substrate', unit: 'g/g', meaning: 'Grams of product formed per gram of substrate directed to product.', group: 'parameter' },
  { symbol: 'α', name: 'Growth-associated coefficient', unit: 'g/g', meaning: 'Product formed in proportion to growth (Luedeking–Piret).', group: 'parameter' },
  { symbol: 'β', name: 'Non-growth-associated coefficient', unit: 'g g⁻¹ h⁻¹', meaning: 'Product formed per unit biomass even without growth (Luedeking–Piret).', group: 'parameter' },
  { symbol: 'm_{s}', name: 'Maintenance coefficient', unit: 'g g⁻¹ h⁻¹', meaning: 'Substrate used just to keep cells alive.', group: 'parameter' },
  { symbol: 'k_{d}', name: 'Specific death rate', unit: 'h⁻¹', meaning: 'Fraction of biomass lost to death or decay per hour.', group: 'parameter' },
  { symbol: 'F', name: 'Feed flow rate', unit: 'L/h', meaning: 'Volumetric flow of fresh feed into the vessel (fed-batch).', group: 'operating' },
  { symbol: 'S_{f}', name: 'Feed substrate concentration', unit: 'g/L', meaning: 'Substrate concentration in the incoming feed.', group: 'operating' },
  { symbol: 'D', name: 'Dilution rate', unit: 'h⁻¹', meaning: 'Flow rate divided by volume, D = F/V. It is also the reciprocal of the mean residence time.', group: 'operating' },
]

export const DERIVED_EQUATIONS = [
  {
    id: 'dcrit',
    title: 'Critical dilution rate',
    lines: ['D_{crit} = μ_{max} S_{f} / (K_{s} + S_{f}) − k_{d}'],
    meaning:
      'In a CSTR the substrate concentration can never exceed S_{f}, so the best growth rate the culture can ever reach is μ(S_{f}) − k_{d}. If D exceeds D_{crit}, cells leave faster than they can be replaced and the culture washes out.',
  },
  {
    id: 'steady',
    title: 'CSTR steady state (D < D_crit)',
    lines: ['μ* = D + k_{d}', 'S* = K_{s} μ* / (μ_{max} − μ*)', 'X* = D (S_{f} − S*) / q_{S}(μ*)', 'P* = q_{p}(μ*) X* / D'],
    meaning:
      'Setting all derivatives to zero: the growth rate that balances losses fixes S*, the substrate balance then fixes X*, and the product balance fixes P*. The chart in the Lab draws these values as dashed lines so you can check that the simulation converges to them.',
  },
  {
    id: 'yield',
    title: 'Realized yield and productivity',
    lines: [
      'Y_{realized} = (X V − X_{0} V_{0} + biomass washed out) / substrate consumed',
      'Q = (P V − P_{0} V_{0} + product washed out) / t',
    ],
    meaning:
      'Whole-vessel mass balances (amount = concentration × volume). Substrate consumed is what was initially present plus what was fed, minus what remains and what left in the outflow. This stays meaningful when volume changes, which concentrations alone do not.',
  },
]

export const ASSUMPTIONS = [
  'Educational and simplified: a teaching model, not a predictor of any real industrial process.',
  'Deterministic: the same parameters always give the same trajectory. There is no noise or randomness.',
  'Idealised mass balances with a perfectly mixed vessel (no gradients in concentration, temperature or shear).',
  'A single limiting substrate follows Monod kinetics. No substrate or product inhibition, and no lag phase.',
  'Oxygen transfer, pH, temperature and CO₂ are not modelled. The bubbles and impeller in the animation are visual context, not simulated variables.',
  'Yield and kinetic coefficients are constant throughout a run, so they do not change between growth phases.',
  'Feed streams contain no cells or product, and the fed-batch has no outflow.',
  'The reactor animation is drawn from the simulated state, but its geometry is schematic and not to scale.',
]

export const REFERENCES = [
  'Monod, J. (1949). The growth of bacterial cultures. Annual Review of Microbiology, 3, 371–394.',
  'Luedeking, R. and Piret, E. L. (1959). A kinetic study of the lactic acid fermentation: batch process at controlled pH. Journal of Biochemical and Microbiological Technology and Engineering, 1(4), 393–412.',
  'Shuler, M. L. and Kargı, F. Bioprocess Engineering: Basic Concepts. Prentice Hall.',
  'Doran, P. M. Bioprocess Engineering Principles. Academic Press.',
]
