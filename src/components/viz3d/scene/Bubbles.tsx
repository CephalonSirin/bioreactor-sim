import { memo, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BUBBLE_FRAG, BUBBLE_VERT } from '../glsl'
import { particleSphere, rng, useScene, visibleCount } from '../sceneContext'
import { IMP_LOW, SPARGE_R, SPARGE_Y } from '../dims'

/**
 * Gas bubbles from the sparger ring: one instanced draw. They rise, are
 * thrown outward where they cross the lower turbine (gas dispersion),
 * swell slightly as hydrostatic pressure falls, and vanish at the
 * surface. The share of bubbles shown = base aeration + metabolic gas
 * evolution (mu*X relative to the run's peak).
 */
function Bubbles({ visible }: { visible: boolean }) {
  const { bus, shared, tier } = useScene()
  const count = tier === 'high' ? 360 : 150

  const res = useMemo(() => {
    const r = rng(5)
    const A = new Float32Array(count * 4)
    const B = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      A.set([r(), r() * Math.PI * 2, r(), (i + r()) / count], i * 4)
      B.set([0.5 + r(), r(), Math.sqrt(r()), r()], i * 4)
    }
    const geo = particleSphere(tier === 'high' ? 2 : 1)
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4))
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4))
    geo.instanceCount = count
    const mat = new THREE.ShaderMaterial({
      vertexShader: BUBBLE_VERT,
      fragmentShader: BUBBLE_FRAG,
      uniforms: {
        uLevelY: shared.uLevelY,
        uBaseY: shared.uBaseY,
        uRad: shared.uRad,
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uSpargeY: { value: SPARGE_Y + 0.02 },
        uSpargeR: { value: SPARGE_R },
        uImpY: { value: IMP_LOW },
        uAgit: shared.uAgit,
        uSigma: { value: 0.3 },
        uKeyDir: shared.uKeyDir,
        uFade: shared.uFade,
      },
      transparent: true,
      depthWrite: false,
    })
    return { geo, mat }
  }, [count, shared, tier])

  useEffect(
    () => () => {
      res.geo.dispose()
      res.mat.dispose()
    },
    [res]
  )

  useFrame(() => {
    const u = res.mat.uniforms
    // Bubbles use the process clock: frozen when paused, like everything else.
    u.uTime.value = bus.clock
    // Constant aeration plus metabolic gas evolution.
    const intensity = visible ? 0.3 + 0.7 * bus.live.gas : 0
    u.uIntensity.value = intensity
    res.geo.instanceCount = visibleCount(count, intensity)
    u.uSigma.value = (0.22 + 3.6 * bus.live.turbidity) * 0.35
  })

  return <mesh geometry={res.geo} material={res.mat} renderOrder={12} frustumCulled={false} />
}

export default memo(Bubbles)
