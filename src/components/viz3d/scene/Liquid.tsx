import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { JET_FRAG, LIQUID_FRAG, LIQUID_VERT, SURFACE_FRAG, SURFACE_VERT, UV_VERT } from '../glsl'
import { useScene } from '../sceneContext'
import { IMP_HIGH, IMP_LOW, R_LIQ, levelY } from '../dims'

/** Polar grid so the surface can be displaced everywhere, not just at the rim. */
function surfaceGeometry(rings: number, segments: number) {
  const pos: number[] = [0, 0, 0]
  const idx: number[] = []
  for (let i = 1; i <= rings; i++) {
    const r = (i / rings) * R_LIQ
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r)
    }
  }
  const at = (i: number, j: number) => 1 + (i - 1) * segments + (j % segments)
  for (let j = 0; j < segments; j++) idx.push(0, at(1, j + 1), at(1, j))
  for (let i = 1; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = at(i, j)
      const b = at(i, j + 1)
      const c = at(i + 1, j)
      const d = at(i + 1, j + 1)
      idx.push(a, b, c, b, d, c)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  return g
}

/**
 * The culture as a participating medium: a volume whose colour and
 * opacity come from the path length through it (Beer-Lambert, extinction
 * set by biomass), a displaced free surface that responds to agitation
 * and gassing, a meniscus line, and faint discharge streaks off each
 * submerged impeller.
 */
function Liquid({ flow }: { flow: boolean }) {
  const { bus, shared, tier } = useScene()

  const res = useMemo(() => {
    const body = new THREE.CylinderGeometry(R_LIQ, R_LIQ, 1, tier === 'high' ? 96 : 56, 1, true)
    body.translate(0, 0.5, 0)
    const surface = surfaceGeometry(tier === 'high' ? 26 : 16, tier === 'high' ? 96 : 56)
    const common = { transparent: true, depthWrite: false }
    const bodyMat = new THREE.ShaderMaterial({
      vertexShader: LIQUID_VERT,
      fragmentShader: LIQUID_FRAG,
      uniforms: {
        uLevelY: shared.uLevelY,
        uBaseY: shared.uBaseY,
        uRad: shared.uRad,
        uColor: shared.uColor,
        uTurb: shared.uTurb,
        uTime: shared.uTime,
        uKeyDir: shared.uKeyDir,
        uFade: shared.uFade,
      },
      ...common,
    })
    const surfaceMat = new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERT,
      fragmentShader: SURFACE_FRAG,
      uniforms: {
        uLevelY: shared.uLevelY,
        uBaseY: shared.uBaseY,
        uRad: shared.uRad,
        uTime: shared.uTime,
        uAgit: shared.uAgit,
        uGas: shared.uGas,
        uColor: shared.uColor,
        uTurb: shared.uTurb,
        uKeyDir: shared.uKeyDir,
        uRimDir: shared.uRimDir,
        uFade: shared.uFade,
      },
      ...common,
    })
    const meniscusMat = new THREE.MeshBasicMaterial({ color: '#5d676d', transparent: true, opacity: 0.35, depthWrite: false })
    const jetGeo = new THREE.RingGeometry(0.34, 0.95, 64, 1)
    jetGeo.rotateX(-Math.PI / 2)
    const jetMat = new THREE.ShaderMaterial({
      vertexShader: UV_VERT,
      fragmentShader: JET_FRAG,
      uniforms: { uTime: { value: 0 }, uAmt: { value: 0 }, uColor: { value: new THREE.Color('#ffffff') } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    return { body, surface, bodyMat, surfaceMat, meniscusMat, jetGeo, jetMat }
  }, [shared, tier])

  useEffect(
    () => () => {
      res.body.dispose()
      res.surface.dispose()
      res.bodyMat.dispose()
      res.surfaceMat.dispose()
      res.meniscusMat.dispose()
      res.jetGeo.dispose()
      res.jetMat.dispose()
    },
    [res]
  )

  const meniscus = useRef<THREE.Mesh>(null)
  const jets = useRef<THREE.Group>(null)

  useFrame(() => {
    const y = levelY(bus.live.level)
    if (meniscus.current) meniscus.current.position.y = y + 0.004
    // Discharge streaks: visible only on submerged impellers while stirring,
    // and hidden by a dense culture just as the impeller itself is.
    res.jetMat.uniforms.uTime.value = bus.spin * 0.6 + bus.clock
    res.jetMat.uniforms.uAmt.value = flow ? bus.motion * 0.085 * (1 - bus.live.turbidity * 0.8) : 0
    if (jets.current) {
      jets.current.children[0].visible = y > IMP_LOW + 0.1
      jets.current.children[1].visible = y > IMP_HIGH + 0.1
    }
  })

  return (
    <group>
      <mesh geometry={res.body} material={res.bodyMat} renderOrder={5} frustumCulled={false} />
      <mesh geometry={res.surface} material={res.surfaceMat} renderOrder={6} frustumCulled={false} />
      <mesh ref={meniscus} rotation={[Math.PI / 2, 0, 0]} material={res.meniscusMat} renderOrder={7}>
        <torusGeometry args={[R_LIQ - 0.004, 0.007, 6, 128]} />
      </mesh>
      <group ref={jets}>
        <mesh geometry={res.jetGeo} material={res.jetMat} position={[0, IMP_LOW, 0]} renderOrder={8} />
        <mesh geometry={res.jetGeo} material={res.jetMat} position={[0, IMP_HIGH, 0]} renderOrder={8} />
      </group>
    </group>
  )
}

export default memo(Liquid)
