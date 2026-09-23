import { memo, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DUST_FRAG, DUST_VERT, FLOOR_FRAG, FLOOR_VERT } from '../glsl'
import { rng, useScene } from '../sceneContext'

type Softbox = { shape: 'rect' | 'ring'; size: [number, number]; color: string; intensity: number; position: [number, number, number]; target: [number, number, number] }

const SOFTBOXES: Softbox[] = [
  { shape: 'rect', size: [4, 6], color: '#fff6ea', intensity: 2.4, position: [3.5, 4, 5], target: [0, 2, 0] },
  { shape: 'rect', size: [1.2, 8], color: '#d8f5f0', intensity: 1.1, position: [-6, 3, -3], target: [0, 2, 0] },
  { shape: 'rect', size: [1, 6], color: '#dfe9ff', intensity: 0.9, position: [5, 2, -5], target: [0, 2, 0] },
  { shape: 'ring', size: [4, 5], color: '#ffffff', intensity: 0.8, position: [0, 9, 0], target: [0, 0, 0] },
  { shape: 'rect', size: [10, 1], color: '#8fb5b0', intensity: 0.25, position: [0, -2, 4], target: [0, 2, 0] },
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

/**
 * Studio lighting for a product-style render: warm key, cool teal rim,
 * soft fill, plus the softbox environment for reflections.
 */
function Lights() {
  return (
    <>
      <hemisphereLight args={['#bfe3dd', '#061012', 0.55]} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} color="#fff4e6" />
      <directionalLight position={[-5, 3, -4]} intensity={1.4} color="#7fe6d6" />
      <directionalLight position={[-3, 1.5, 5]} intensity={0.45} color="#9fb8ff" />
      <StudioEnvironment />
    </>
  )
}

function Floor() {
  const { bus } = useScene()
  const res = useMemo(() => {
    const geo = new THREE.CircleGeometry(13, 96)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      uniforms: { uGlow: { value: new THREE.Color() }, uGlowAmt: { value: 0 }, uFade: { value: 1 } },
      transparent: true,
      depthWrite: false,
    })
    return { geo, mat }
  }, [])
  useEffect(() => () => {
    res.geo.dispose()
    res.mat.dispose()
  }, [res])
  useFrame(() => {
    const c = bus.live.color
    res.mat.uniforms.uGlow.value.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace)
    res.mat.uniforms.uGlowAmt.value = 0.6 + 0.6 * bus.live.turbidity
  })
  return <mesh geometry={res.geo} material={res.mat} renderOrder={-1} />
}

/** Slow airborne motes that give the room depth. Decorative: frozen for reduced motion. */
function Dust() {
  const { bus } = useScene()
  const pr = useThree((s) => s.viewport.dpr)
  const res = useMemo(() => {
    const n = 240
    const r = rng(77)
    const pos = new Float32Array(n * 3)
    const a = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2
      const rad = 2.2 + r() * 6
      pos.set([Math.cos(ang) * rad, r() * 7, Math.sin(ang) * rad - 1], i * 3)
      a.set([r(), r(), r(), r()], i * 4)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aA', new THREE.BufferAttribute(a, 4))
    const mat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uFade: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo, mat }
  }, [])
  useEffect(() => () => {
    res.geo.dispose()
    res.mat.dispose()
  }, [res])
  useFrame((state) => {
    if (!bus.reduced) res.mat.uniforms.uTime.value = state.clock.elapsedTime
    res.mat.uniforms.uPR.value = pr
  })
  return <points geometry={res.geo} material={res.mat} renderOrder={40} frustumCulled={false} />
}

function Stage() {
  const { tier } = useScene()
  return (
    <>
      <Lights />
      <Floor />
      {tier === 'high' && <Dust />}
    </>
  )
}

export default memo(Stage)
