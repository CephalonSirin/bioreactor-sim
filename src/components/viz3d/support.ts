import type { Tier } from './bus'

let webgl: boolean | null = null

/** three.js r163+ needs WebGL 2. Probed once, then cached. */
export function hasWebGL2(): boolean {
  if (webgl !== null) return webgl
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    webgl = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl = false
  }
  return webgl
}

/**
 * Phones, tablets and low-memory machines get the lighter scene: fewer
 * particles, lower pixel ratio, no ambient dust.
 */
export function deviceTier(): Tier {
  if (typeof window === 'undefined') return 'low'
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency ?? 8
  return coarse || narrow || (mem !== undefined && mem <= 4) || cores <= 4 ? 'low' : 'high'
}

/**
 * Hand-off from the home hero to the Lab: when set, the Lab camera starts
 * where the hero camera ended (inside the vessel) and pulls back out.
 */
export const labEntrance = { fromHero: false }
