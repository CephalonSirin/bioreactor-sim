import type { VisualTargets } from './visualState'
import { SERIES } from '../../lib/palette'

export type LayerKey = 'biomass' | 'substrate' | 'product' | 'bubbles' | 'flow' | 'instruments'
export type Layers = Record<LayerKey, boolean>

export const ALL_LAYERS: Layers = {
  biomass: true,
  substrate: true,
  product: true,
  bubbles: true,
  flow: true,
  instruments: true,
}

export const LAYER_INFO: { key: LayerKey; label: string; color: string; hint: string }[] = [
  { key: 'biomass', label: 'Biomass', color: SERIES.X, hint: 'Particle density and broth colour follow biomass concentration X. Particles are a density cue, not individual cells.' },
  { key: 'substrate', label: 'Substrate', color: SERIES.S, hint: 'Dot density follows substrate concentration S, relative to its peak in this run.' },
  { key: 'product', label: 'Product', color: SERIES.P, hint: 'Ring density follows product concentration P, relative to its peak in this run.' },
  { key: 'bubbles', label: 'Gas', color: '#8C949A', hint: 'Illustrative: a constant aeration rate plus extra gas scaled by growth activity μX. Oxygen transfer is not modelled.' },
  { key: 'flow', label: 'Flow', color: SERIES.V, hint: 'Feed and effluent streams; speed follows F (fed-batch) or D·V (CSTR).' },
  { key: 'instruments', label: 'Hardware', color: '#8C949A', hint: 'Probes and head-plate fittings for context only. pH, dissolved oxygen and temperature are not simulated.' },
]

export type Tier = 'high' | 'low'

/** Minimal surface of drei's CameraControls that the DOM layer drives. */
export interface CameraApi {
  reset: (smooth?: boolean) => void
  rotate: (azimuth: number, polar: number) => void
  dolly: (amount: number) => void
}

/**
 * Mutable channel between the DOM layer and the render loop. Simulation
 * updates write `target`; the scene damps `live` toward it every frame, so
 * playback ticks never re-render the React scene graph.
 */
export interface ReactorBus {
  target: VisualTargets
  live: VisualTargets
  playing: boolean
  /** Eased 0..1 follower of `playing`: motion spins down instead of halting. */
  motion: number
  /** Animation clock that only advances while the process runs. */
  clock: number
  /** Impeller angle (rad). */
  spin: number
  reduced: boolean
  /** Snap to the target on the next frame (seek / new run). */
  snap: boolean
  /** Set by the director once `live` has converged on `target`. */
  settled: boolean
  /** Set by the camera rig while the view is moving for a reason other than idle drift. */
  cameraBusy: boolean
  camera: CameraApi | null
  /** Hero only: set when the user heads into the Lab. */
  leaving: boolean
  /** Normalised pointer position for parallax, -0.5..0.5. */
  pointer: { x: number; y: number }
}

export function cloneTargets(t: VisualTargets): VisualTargets {
  return { ...t, color: [t.color[0], t.color[1], t.color[2]] }
}

export function createBus(target: VisualTargets, reduced: boolean): ReactorBus {
  return {
    target,
    live: cloneTargets(target),
    playing: false,
    motion: 0,
    clock: 0,
    spin: 0,
    reduced,
    snap: true,
    settled: false,
    cameraBusy: false,
    camera: null,
    leaving: false,
    pointer: { x: 0, y: 0 },
  }
}
