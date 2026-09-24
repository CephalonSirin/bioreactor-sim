import { memo, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOOR_FRAG, FLOOR_VERT } from '../glsl'

type Softbox = { shape: 'rect' | 'ring'; size: [number, number]; color: string; intensity: number; position: [number, number, number]; target: [number, number, number] }

// A daylight photo studio: a large overhead diffuser, a tall key strip and a
// pale cyclorama bounce, all neutral so the steel reads as steel.
const SOFTBOXES: Softbox[] = [
  { shape: 'rect', size: [5, 7], color: '#fffaf2', intensity: 2.2, position: [3.5, 4, 5], target: [0, 2, 0] },
  { shape: 'rect', size: [1.4, 8], color: '#f4f6f7', intensity: 1.2, position: [-6, 3, -3], target: [0, 2, 0] },
  { shape: 'rect', size: [1.2, 6], color: '#eef1f4', intensity: 0.9, position: [5, 2, -5], target: [0, 2, 0] },
  { shape: 'ring', size: [4, 6], color: '#ffffff', intensity: 1.1, position: [0, 9, 0], target: [0, 0, 0] },
  { shape: 'rect', size: [14, 3], color: '#e9e9e5', intensity: 0.7, position: [0, -2, 4], target: [0, 2, 0] },
  { shape: 'rect', size: [16, 8], color: '#f2f2ef', intensity: 0.45, position: [0, 3, -9], target: [0, 2, 0] },
]

/**
 * A procedural studio environment: a few emissive softboxes prefiltered
 * once with PMREM. It gives steel and glass believable reflections
 * without downloading an HDRI (or shipping HDR/EXR decoders).
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const env = new THREE.Scene()
    env.background = new THREE.Color('#b9bab6')
    const disposables: { dispose: () => void }[] = []
    for (const b of SOFTBOXES) {
      const geo = b.shape === 'ring' ? new THREE.RingGeometry(b.size[0], b.size[1], 48) : new THREE.PlaneGeometry(b.size[0], b.size[1])
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(b.color).multiplyScalar(b.intensity), side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(...b.position)
      mesh.lookAt(...b.target)
      env.add(mesh)
      disposables.push(geo, mat)
    }
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromScene(env, 0.02)
    scene.environment = rt.texture
    return () => {
      if (scene.environment === rt.texture) scene.environment = null
      rt.dispose()
      pmrem.dispose()
      disposables.forEach((d) => d.dispose())
    }
  }, [gl, scene])
  return null
}

/** Soft, neutral daylight: a warm-white key, a cool fill and a pale bounce from the bench. */
function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#cfcfca', 0.9]} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} color="#fff8ee" />
      <directionalLight position={[-5, 3, -4]} intensity={0.9} color="#e8eef2" />
      <directionalLight position={[-3, 1.5, 5]} intensity={0.35} color="#ffffff" />
      <StudioEnvironment />
    </>
  )
}

/** Bench surface: only a contact shadow and faint rules, so the page shows through. */
function Floor() {
  const res = useMemo(() => {
    const geo = new THREE.CircleGeometry(11, 96)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      uniforms: { uFade: { value: 1 } },
      transparent: true,
      depthWrite: false,
    })
    return { geo, mat }
  }, [])
  useEffect(() => () => {
    res.geo.dispose()
    res.mat.dispose()
  }, [res])
  return <mesh geometry={res.geo} material={res.mat} renderOrder={-1} />
}

function Stage() {
  return (
    <>
      <Lights />
      <Floor />
    </>
  )
}

export default memo(Stage)
