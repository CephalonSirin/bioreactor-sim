import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RIPPLE_FRAG, STREAM_FRAG, TUBE_FRAG, UV_VERT } from '../glsl'
import { MAT, ledMaterial } from '../materials'
import { useScene } from '../sceneContext'
import { HEAD_T, PORT_FEED, PORT_HARVEST, Y_TOP, levelY } from '../dims'
import type { ReactorType } from '../../../simulation/types'

type V3 = [number, number, number]
const HEAD_TOP = Y_TOP + HEAD_T
// Fresh medium, matching the vessel's straw-coloured medium.
const MEDIUM = new THREE.Color('#d8cfa4')
const LED_RUN = new THREE.Color('#2fb37a')
const LED_OFF = new THREE.Color('#5a6166')

function useTube(points: V3[], fluid: THREE.Color | { value: THREE.Color }) {
  const res = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
    const geo = new THREE.TubeGeometry(curve, 120, 0.028, 10, false)
    const mat = new THREE.ShaderMaterial({
      vertexShader: UV_VERT,
      fragmentShader: TUBE_FRAG,
      uniforms: {
        uFluid: 'value' in fluid ? fluid : { value: fluid },
        uFlow: { value: 0 },
        uTime: { value: 0 },
        uLen: { value: curve.getLength() },
        uShow: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
    })
    return { geo, mat }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)])
  useEffect(() => () => {
    res.geo.dispose()
    res.mat.dispose()
  }, [res])
  return res
}

/** GL45 media bottle with a liquid fill that follows the simulated reservoir. */
function Bottle({ position, fill, color }: { position: V3; fill: 'bottle' | 'harvest'; color: 'medium' | 'culture' }) {
  const { bus, shared } = useScene()
  const liquid = useRef<THREE.Mesh>(null)
  const res = useMemo(() => {
    const profile = [
      [0.0, 0.0],
      [0.4, 0.0],
      [0.43, 0.03],
      [0.44, 0.1],
      [0.44, 0.92],
      [0.4, 1.04],
      [0.2, 1.16],
      [0.15, 1.2],
      [0.15, 1.32],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const glass = new THREE.LatheGeometry(profile, 48)
    const liqMat = new THREE.MeshStandardMaterial({
      color: '#e4dab0',
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      metalness: 0,
      depthWrite: false,
    })
    return { glass, liqMat }
  }, [])
  useEffect(() => () => {
    res.glass.dispose()
    res.liqMat.dispose()
  }, [res])

  useFrame(() => {
    const f = Math.max(bus.live[fill], 0.02)
    if (liquid.current) {
      liquid.current.scale.y = f * 0.86
      liquid.current.position.y = 0.04 + (f * 0.86) / 2
    }
    if (color === 'culture') {
      res.liqMat.color.copy(shared.uColor.value)
      res.liqMat.opacity = 0.35 + 0.5 * bus.live.turbidity
    }
  })

  return (
    <group position={position}>
      <mesh ref={liquid} material={res.liqMat} renderOrder={24}>
        <cylinderGeometry args={[0.41, 0.41, 1, 40]} />
      </mesh>
      <mesh geometry={res.glass} material={MAT.glassSolid} renderOrder={26} />
      {/* Paper label and blue GL45 cap */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.447, 0.447, 0.3, 32, 1, true, 0, 1.4]} />
        <meshStandardMaterial color="#e6ecea" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.36, 0]} material={MAT.capBlue}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 32]} />
      </mesh>
    </group>
  )
}

/** Peristaltic pump: the rotor turns at a rate set by the simulated flow. */
function Pump({ position, flowKey }: { position: V3; flowKey: 'feed' | 'outflow' }) {
  const { bus } = useScene()
  const rotor = useRef<THREE.Group>(null)
  const led = useMemo(() => ledMaterial('#2fb37a'), [])
  useEffect(() => () => led.dispose(), [led])
  useFrame((_, dt) => {
    const rate = bus.live[flowKey]
    if (rotor.current && !bus.reduced) rotor.current.rotation.z -= Math.min(dt, 0.1) * (1.2 + 7 * rate) * bus.motion
    led.color.copy(LED_OFF).lerp(LED_RUN, bus.motion)
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={MAT.housing}>
        <boxGeometry args={[0.62, 0.4, 0.46]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={MAT.rubber}>
        <boxGeometry args={[0.6, 0.04, 0.44]} />
      </mesh>
      <mesh position={[0, 0.22, 0.235]} rotation={[Math.PI / 2, 0, 0]} material={MAT.darkSteel}>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 40]} />
      </mesh>
      <group ref={rotor} position={[0, 0.22, 0.26]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.steel}>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 20]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <group key={i}>
              <mesh position={[Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0]} rotation={[0, 0, a]} material={MAT.brushed}>
                <boxGeometry args={[0.11, 0.025, 0.03]} />
              </mesh>
              <mesh position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.steel}>
                <cylinderGeometry args={[0.028, 0.028, 0.045, 16]} />
              </mesh>
            </group>
          )
        })}
      </group>
      <mesh position={[0.22, 0.33, 0.232]} material={led}>
        <circleGeometry args={[0.014, 12]} />
      </mesh>
      <mesh position={[0.14, 0.33, 0.232]} material={MAT.screen}>
        <planeGeometry args={[0.1, 0.05]} />
      </mesh>
    </group>
  )
}

function FeedLine({ flow }: { flow: boolean }) {
  const { bus } = useScene()
  const bottle: V3 = [-2.55, 0, -0.35]
  const pump: V3 = [-2.05, 0, 0.85]
  const [px, pz] = PORT_FEED

  const supply = useTube(
    [
      [bottle[0], 1.43, bottle[2]],
      [bottle[0], 1.58, bottle[2] + 0.12],
      [bottle[0] + 0.12, 1.1, 0.55],
      [pump[0] - 0.27, 0.32, pump[2] + 0.28],
      [pump[0] - 0.1, 0.1, pump[2] + 0.28],
      [pump[0], 0.08, pump[2] + 0.28],
    ],
    MEDIUM
  )
  const delivery = useTube(
    [
      [pump[0], 0.08, pump[2] + 0.28],
      [pump[0] + 0.1, 0.1, pump[2] + 0.28],
      [pump[0] + 0.27, 0.34, pump[2] + 0.28],
      [-1.6, 1.4, 1.02],
      [-1.4, 3.1, 0.8],
      [-1.0, HEAD_TOP + 0.42, 0.55],
      [px, HEAD_TOP + 0.34, pz],
      [px, HEAD_TOP + 0.1, pz],
    ],
    MEDIUM
  )

  // Feed entering the vessel: a falling stream from the nozzle to the surface.
  const stream = useRef<THREE.Mesh>(null)
  const ripple = useRef<THREE.Mesh>(null)
  const res = useMemo(() => {
    const streamGeo = new THREE.CylinderGeometry(0.024, 0.018, 1, 12, 1, true)
    streamGeo.translate(0, -0.5, 0)
    const streamMat = new THREE.ShaderMaterial({
      vertexShader: UV_VERT,
      fragmentShader: STREAM_FRAG,
      uniforms: { uFluid: { value: MEDIUM }, uFlow: { value: 0 }, uTime: { value: 0 }, uLen: { value: 1 } },
      transparent: true,
      depthWrite: false,
    })
    const rippleMat = new THREE.ShaderMaterial({
      vertexShader: UV_VERT,
      fragmentShader: RIPPLE_FRAG,
      uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uTime: { value: 0 }, uAmt: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { streamGeo, streamMat, rippleMat }
  }, [])
  useEffect(() => () => {
    res.streamGeo.dispose()
    res.streamMat.dispose()
    res.rippleMat.dispose()
  }, [res])

  const nozzleY = Y_TOP - 0.14
  const tubes = [supply, delivery] // built per render, not per frame
  useFrame(() => {
    const feed = bus.live.feed
    const active = flow && bus.motion > 0.02
    for (const t of tubes) {
      t.mat.uniforms.uTime.value = bus.clock
      t.mat.uniforms.uFlow.value = feed
      t.mat.uniforms.uShow.value = flow ? 1 : 0
    }
    const surf = levelY(bus.live.level)
    const len = Math.max(nozzleY - surf, 0.01)
    if (stream.current) {
      stream.current.scale.y = len
      stream.current.visible = active
    }
    res.streamMat.uniforms.uTime.value = bus.clock
    res.streamMat.uniforms.uFlow.value = feed
    res.streamMat.uniforms.uLen.value = len
    if (ripple.current) {
      ripple.current.position.y = surf + 0.012
      ripple.current.visible = active
    }
    res.rippleMat.uniforms.uTime.value = bus.clock
    res.rippleMat.uniforms.uAmt.value = bus.motion * (0.4 + 0.6 * feed)
  })

  return (
    <group>
      <Bottle position={bottle} fill="bottle" color="medium" />
      <Pump position={pump} flowKey="feed" />
      <mesh geometry={supply.geo} material={supply.mat} renderOrder={27} />
      <mesh geometry={delivery.geo} material={delivery.mat} renderOrder={27} />
      <mesh position={[px, Y_TOP - 0.07, pz]} material={MAT.steel}>
        <cylinderGeometry args={[0.022, 0.022, 0.14, 12]} />
      </mesh>
      <mesh ref={stream} geometry={res.streamGeo} material={res.streamMat} position={[px, nozzleY, pz]} renderOrder={13} frustumCulled={false} />
      <mesh ref={ripple} material={res.rippleMat} position={[px, 2, pz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9}>
        <planeGeometry args={[0.5, 0.5]} />
      </mesh>
    </group>
  )
}

/** CSTR effluent: a dip tube set at the working level, pump and harvest bottle. */
function HarvestLine({ flow }: { flow: boolean }) {
  const { bus, shared } = useScene()
  const bottle: V3 = [2.55, 0, -0.35]
  const pump: V3 = [2.05, 0, 0.85]
  const [hx, hz] = PORT_HARVEST
  const effluent = useTube(
    [
      [hx, HEAD_TOP + 0.1, hz],
      [hx, HEAD_TOP + 0.34, hz],
      [1.05, HEAD_TOP + 0.42, 0.25],
      [1.45, 3.1, 0.8],
      [1.62, 1.4, 1.02],
      [pump[0] - 0.27, 0.34, pump[2] + 0.28],
      [pump[0] - 0.1, 0.1, pump[2] + 0.28],
      [pump[0] + 0.1, 0.1, pump[2] + 0.28],
      [pump[0] + 0.27, 0.32, pump[2] + 0.28],
      [bottle[0] - 0.12, 1.1, 0.55],
      [bottle[0], 1.58, bottle[2] + 0.12],
      [bottle[0], 1.43, bottle[2]],
    ],
    shared.uColor
  )
  const dip = useRef<THREE.Mesh>(null)
  useFrame(() => {
    effluent.mat.uniforms.uTime.value = bus.clock
    effluent.mat.uniforms.uFlow.value = bus.live.outflow
    effluent.mat.uniforms.uShow.value = flow ? 1 : 0
    const surf = levelY(bus.live.level)
    if (dip.current) {
      const len = Y_TOP - (surf - 0.03)
      dip.current.scale.y = len
      dip.current.position.y = Y_TOP - len / 2
    }
  })
  return (
    <group>
      <Bottle position={bottle} fill="harvest" color="culture" />
      <Pump position={pump} flowKey="outflow" />
      <mesh geometry={effluent.geo} material={effluent.mat} renderOrder={27} />
      <mesh ref={dip} position={[hx, 2.5, hz]} material={MAT.steel}>
        <cylinderGeometry args={[0.022, 0.022, 1, 12]} />
      </mesh>
    </group>
  )
}

/**
 * Mode-specific plumbing. Batch is a closed vessel (none of this is
 * drawn); fed-batch adds the feed train; CSTR adds feed and effluent.
 */
function FlowSystem({ mode, flow }: { mode: ReactorType; flow: boolean }) {
  if (mode === 'batch') return null
  return (
    <group>
      <FeedLine flow={flow} />
      {mode === 'cstr' && <HarvestLine flow={flow} />}
    </group>
  )
}

export default memo(FlowSystem)
