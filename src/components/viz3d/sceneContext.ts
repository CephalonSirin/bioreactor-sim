import { createContext, useContext } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ReactorBus, Tier } from './bus'
import { R_LIQ, Y0 } from './dims'

export const KEY_DIR = new THREE.Vector3(4, 7, 5).normalize()
export const RIM_DIR = new THREE.Vector3(-5, 3, -4).normalize()

/**
 * Uniform objects shared by reference between every custom material, so
 * the director updates liquid height, turbidity, colour and clocks once
 * per frame for the whole scene.
 */
export function createShared() {
  return {
    uLevelY: { value: Y0 + 1 },
    uBaseY: { value: Y0 + 0.005 },
    uRad: { value: R_LIQ },
    uTime: { value: 0 },
    uTurb: { value: 0 },
    uAgit: { value: 0 },
    uGas: { value: 0 },
    uFade: { value: 1 },
    uColor: { value: new THREE.Color() },
    uKeyDir: { value: KEY_DIR },
    uRimDir: { value: RIM_DIR },
  }
}

export type SharedUniforms = ReturnType<typeof createShared>

export interface SceneContextValue {
  bus: ReactorBus
  shared: SharedUniforms
  tier: Tier
}

export const SceneContext = createContext<SceneContextValue | null>(null)

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext)
  if (!ctx) throw new Error('useScene must be used inside the reactor canvas')
  return ctx
}

/** Deterministic PRNG so particle fields are identical between mounts. */
export function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Unit icosphere for instanced particles. IcosahedronGeometry is
 * non-indexed (each triangle owns its corners); welding shared corners
 * gives the identical mesh but lets the GPU's post-transform cache reuse
 * them, so the heavy particle vertex shaders run several times less often.
 */
export function particleSphere(detail: number) {
  const ico = new THREE.IcosahedronGeometry(1, detail)
  ico.deleteAttribute('uv')
  const welded = mergeVertices(ico)
  const geo = new THREE.InstancedBufferGeometry().copy(welded as unknown as THREE.InstancedBufferGeometry)
  ico.dispose()
  welded.dispose()
  return geo
}

/**
 * How many particles to draw at a given density. Ranks (A.w) rise with the
 * particle index, so everything past this count is hidden by the shader
 * anyway; skipping it avoids running the vertex shader for nothing.
 */
export function visibleCount(total: number, density: number) {
  return Math.min(total, Math.ceil(Math.max(density, 0) * total) + 1)
}

/** Two vec4 seed attributes per particle (see CIRCULATE in glsl.ts). */
export function particleSeeds(n: number, seed: number) {
  const r = rng(seed)
  const A = new Float32Array(n * 4)
  const B = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    A[i * 4] = r()
    A[i * 4 + 1] = r() * Math.PI * 2
    A[i * 4 + 2] = r()
    // Rank decides the order particles appear in as density rises; a
    // stratified shuffle keeps coverage even at low densities.
    A[i * 4 + 3] = (i + r()) / n
    B[i * 4] = r()
    B[i * 4 + 1] = Math.sqrt(r())
    B[i * 4 + 2] = r()
    B[i * 4 + 3] = r()
  }
  return { A, B }
}
