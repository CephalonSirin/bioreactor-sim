// Core domain types for the bioreactor simulation.
// Kept separate from React/UI code so the simulation engine can be
// tested, reused, or swapped out independently of the interface.

export type ReactorType = 'batch' | 'fedbatch' | 'cstr'

/** Kinetic and stoichiometric parameters shared by every reactor type. */
export interface KineticParams {
  /** Maximum specific growth rate, mu_max (1/h) */
  muMax: number
  /** Monod (half-saturation) constant, Ks (g/L) */
  Ks: number
  /** Biomass yield on substrate, Yxs (g biomass / g substrate) */
  Yxs: number
  /** Product yield on substrate, Yps (g product / g substrate) */
  Yps: number
  /** Growth-associated product formation coefficient, alpha (g product / g biomass) */
  alpha: number
  /** Non-growth-associated product formation coefficient, beta (g product / g biomass / h) */
  beta: number
  /** Maintenance/endogenous substrate consumption coefficient, ms (g substrate / g biomass / h) */
  ms: number
  /** Specific death/decay rate, kd (1/h) */
  kd: number
}

/** Initial conditions common to every reactor type. */
export interface InitialConditions {
  /** Initial biomass concentration, X0 (g/L) */
  X0: number
  /** Initial substrate concentration, S0 (g/L) */
  S0: number
  /** Initial product concentration, P0 (g/L) */
  P0: number
  /** Initial working volume, V0 (L) */
  V0: number
}

/** Parameters specific to fed-batch operation. */
export interface FedBatchParams {
  /** Feed flow rate, F (L/h) */
  F: number
  /** Feed substrate concentration, Sf (g/L) */
  Sf: number
}

/** Parameters specific to continuous (CSTR) operation. */
export interface CstrParams {
  /** Dilution rate, D = F/V (1/h) */
  D: number
  /** Feed substrate concentration, Sf (g/L) */
  Sf: number
}

export interface SimulationSettings {
  /** Total simulated duration (h) */
  duration: number
  /** Integration time step (h) */
  dt: number
}

export interface ReactorConfig {
  reactorType: ReactorType
  kinetics: KineticParams
  initial: InitialConditions
  fedBatch: FedBatchParams
  cstr: CstrParams
  settings: SimulationSettings
}

/** A single sampled point of the simulated trajectory. */
export interface SimPoint {
  t: number
  X: number // biomass (g/L)
  S: number // substrate (g/L)
  P: number // product (g/L)
  V: number // volume (L)
  mu: number // specific growth rate at this instant (1/h)
}

export interface SimulationResult {
  points: SimPoint[]
  config: ReactorConfig
}

export interface DerivedMetrics {
  finalBiomass: number
  maxBiomass: number
  finalSubstrate: number
  finalProduct: number
  finalVolume: number
  maxGrowthRate: number
  /** Mean product formation rate over the run (g/h), including any washed-out product */
  productivity: number
  /** Realized (overall) biomass yield on substrate consumed, g/g */
  realizedYield: number
  /** For CSTR: whether the culture washed out (biomass collapsed toward zero) */
  washedOut: boolean
}

/** Per-point cumulative metrics aligned with a trajectory's points. */
export interface RunningMetrics {
  /** Cumulative product formed per hour, g/h (includes washed-out product) */
  productivity: number[]
  /** Cumulative biomass yield on substrate consumed, g/g */
  yield: number[]
  /** Dilution rate D = F/V at each point, 1/h */
  dilution: number[]
}

/** Maxima over a run, used to scale charts and the reactor visualization. */
export interface RunExtents {
  maxX: number
  maxS: number
  maxP: number
  maxV: number
  maxMu: number
  /** Maximum of mu*X, the volumetric growth activity (drives gas evolution) */
  maxMuX: number
  tPeakX: number
  duration: number
}
