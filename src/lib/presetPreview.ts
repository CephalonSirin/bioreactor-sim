import { downsample, runSimulation } from '../simulation/integrator'
import { computeMetrics } from '../simulation/metrics'
import type { Preset } from '../simulation/presets'
import type { DerivedMetrics, SimPoint } from '../simulation/types'

export interface PresetPreview {
  points: SimPoint[]
  metrics: DerivedMetrics
}

const cache = new Map<string, PresetPreview>()

/** Real simulation of a preset (memoised) used for card sparklines and stats. */
export function getPresetPreview(preset: Preset): PresetPreview | null {
  const hit = cache.get(preset.id)
  if (hit) return hit
  try {
    const result = runSimulation(preset.build())
    const value = { points: downsample(result.points, 120), metrics: computeMetrics(result) }
    cache.set(preset.id, value)
    return value
  } catch {
    return null
  }
}
