import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SceneContext, createShared, useScene } from './sceneContext'
import type { Layers, ReactorBus, Tier } from './bus'
import type { ReactorType } from '../../simulation/types'
import Director from './scene/Director'
import Stage from './scene/Stage'
import Vessel from './scene/Vessel'
import Impeller from './scene/Impeller'
import Liquid from './scene/Liquid'
import Culture from './scene/Culture'
import Bubbles from './scene/Bubbles'
import FlowSystem from './scene/FlowSystem'
import { HeroCamera, LabCamera } from './scene/CameraRig'

export type CaptureFn = () => HTMLCanvasElement | null

export interface ReactorCanvasProps {
  bus: ReactorBus
  mode: ReactorType
  layers: Layers
  variant: 'lab' | 'hero'
  tier: Tier
  active: boolean
  interactive: boolean
  compact: boolean
  entrance: 'hero' | 'normal' | 'none'
  captureRef?: React.MutableRefObject<CaptureFn | null>
  onReady: () => void
  onLost: () => void
}

/** Signals the DOM layer once real frames exist, so the canvas can fade in. */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const n = useRef(0)
  useFrame(() => {
    n.current += 1
    if (n.current === 3) onReady()
  })
  return null
}

/** Exposes a synchronous snapshot of the current frame for PNG export. */
function Capture({ captureRef }: { captureRef?: React.MutableRefObject<CaptureFn | null> }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!captureRef) return
    captureRef.current = () => {
      gl.render(scene, camera)
      const src = gl.domElement
      const out = document.createElement('canvas')
      out.width = src.width
      out.height = src.height
      out.getContext('2d')?.drawImage(src, 0, 0)
      return out
    }
    return () => {
      captureRef.current = null
    }
  }, [gl, scene, camera, captureRef])
  return null
}

/**
 * Pixel-ratio ladder per tier, capped at the display's own ratio (never
 * supersample a 1x screen). Rendering starts at 1.75 (high) or 1.25 (low)
 * or the display's ratio if lower; the pacer moves along the ladder as
 * measured smoothness allows.
 */
function dprLadder(tier: Tier) {
  const cap = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const rungs = (tier === 'high' ? [1, 1.25, 1.5, 1.75, 2] : [1, 1.25, 1.5]).filter((r) => r <= cap + 0.01)
  const steps = rungs.length ? rungs : [cap]
  const first = tier === 'high' ? 1.75 : 1.25
  let start = 0
  while (start < steps.length - 1 && steps[start + 1] <= first) start++
  return { steps, start }
}

/** Display frames per rendered frame, to render at most ~60 fps on high-refresh screens. */
const FULL_RATE_MS = 1000 / 60
/** Frame interval once nothing in the scene is changing (paused, settled, camera at rest). */
const IDLE_MS = 1000 / 30
const IDLE_REDUCED_MS = 1000 / 10

/**
 * Drives rendering (the canvas runs with frameloop="never"). While the
 * process plays, the state is still easing, or the camera is being moved,
 * it renders every display frame up to ~60 fps; when all of that is at
 * rest it renders at an idle rate that still carries the slow camera
 * drift and dust. Busy stretches double as the performance probe for the
 * pixel-ratio ladder: frequent late frames step it down, sustained
 * headroom steps it back up, and it stops adjusting if it oscillates.
 */
function FramePacer({ active, hero, steps, start, onDpr }: { active: boolean; hero: boolean; steps: number[]; start: number; onDpr: (dpr: number) => void }) {
  const { bus } = useScene()
  const advance = useThree((s) => s.advance)
  const clock = useThree((s) => s.clock)
  const rung = useRef(start)
  const locked = useRef(false)

  useEffect(() => {
    if (!active) return
    const base = clock.elapsedTime
    let origin = -1
    let raf = 0
    let prev = 0
    let disp = FULL_RATE_MS // display frame interval, from the shortest recent rAF gap
    let winMin = Infinity
    let winN = 0
    let tick = 0
    let lastRender = 0
    let lastEvery = 0
    let frames = 0
    let late = 0
    let calm = 0
    let lastDir = 0
    let flips = 0

    const step = (dir: 1 | -1) => {
      rung.current += dir
      if (lastDir && dir !== lastDir && ++flips >= 2) locked.current = true
      lastDir = dir
      calm = 0
      onDpr(steps[rung.current])
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (origin < 0) origin = now
      const gap = prev ? now - prev : 0
      prev = now
      if (gap > 100) lastRender = 0 // tab or window was hidden: don't score that gap
      else if (gap > 3) winMin = Math.min(winMin, gap)
      if (++winN >= 30) {
        if (winMin < Infinity) disp = winMin
        winMin = Infinity
        winN = 0
      }

      const busy = hero || bus.playing || bus.motion > 1e-3 || !bus.settled || bus.cameraBusy
      const full = Math.max(1, Math.floor(FULL_RATE_MS / disp + 0.3))
      const every = busy ? full : Math.max(full, Math.round((bus.reduced ? IDLE_REDUCED_MS : IDLE_MS) / disp))
      if (++tick < every) return
      tick = 0

      if (busy && every === lastEvery && lastRender && !locked.current) {
        frames++
        if (now - lastRender > (every + 0.5) * disp) late++
        if (frames >= 90) {
          const ratio = late / frames
          if (ratio > 0.25 && rung.current > 0) step(-1)
          else if (ratio < 0.04 && rung.current < steps.length - 1) {
            if (++calm >= 3) step(1)
          } else calm = 0
          frames = 0
          late = 0
        }
      }
      lastRender = now
      lastEvery = busy ? every : 0
      advance(base + (now - origin) / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, hero, advance, clock, bus, steps, onDpr])

  return null
}

/**
 * The WebGL scene. Loaded lazily so three.js never blocks first paint;
 * everything inside reads the shared bus, so React only re-renders this
 * tree when the reactor mode, layers or device tier change.
 */
function ReactorCanvas(props: ReactorCanvasProps) {
  const { bus, mode, layers, variant, tier, active, interactive, compact, entrance, captureRef, onReady, onLost } = props
  const shared = useMemo(createShared, [])
  const ctx = useMemo(() => ({ bus, shared, tier }), [bus, shared, tier])
  const ladder = useMemo(() => dprLadder(tier), [tier])
  const [dpr, setDpr] = useState(() => ladder.steps[ladder.start])

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.1, far: 80, position: [5.5, 4.5, 8.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping
        gl.toneMappingExposure = 1.08
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onLost()
        })
      }}
      aria-hidden="true"
    >
      <SceneContext.Provider value={ctx}>
        <FramePacer active={active} hero={variant === 'hero'} steps={ladder.steps} start={ladder.start} onDpr={setDpr} />
        <Director />
        <Stage />
        <Vessel instruments={layers.instruments} />
        <Impeller />
        <Liquid flow={layers.flow} />
        <Culture layers={layers} />
        <Bubbles visible={layers.bubbles} />
        <FlowSystem mode={mode} flow={layers.flow} />
        {variant === 'lab' ? <LabCamera mode={mode} interactive={interactive} compact={compact} entrance={entrance} /> : <HeroCamera />}
        <FirstFrame onReady={onReady} />
        <Capture captureRef={captureRef} />
      </SceneContext.Provider>
    </Canvas>
  )
}

// Memoised: its parent re-renders on every playback tick, and each
// re-render of <Canvas> would make R3F reconcile the whole scene graph.
export default memo(ReactorCanvas)
