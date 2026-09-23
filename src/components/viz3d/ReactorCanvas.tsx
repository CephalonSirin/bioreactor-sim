import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { SceneContext, createShared } from './sceneContext'
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
 * The WebGL scene. Loaded lazily so three.js never blocks first paint;
 * everything inside reads the shared bus, so React only re-renders this
 * tree when the reactor mode, layers or device tier change.
 */
export default function ReactorCanvas(props: ReactorCanvasProps) {
  const { bus, mode, layers, variant, tier, active, interactive, compact, entrance, captureRef, onReady, onLost } = props
  const shared = useMemo(createShared, [])
  const ctx = useMemo(() => ({ bus, shared, tier }), [bus, shared, tier])
  const maxDpr = tier === 'high' ? 2 : 1.5
  const [dpr, setDpr] = useState(maxDpr)

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, dpr]}
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
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
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
