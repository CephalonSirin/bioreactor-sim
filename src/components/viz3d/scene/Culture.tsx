import { memo, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CELL_FRAG, CELL_VERT, GLOW_FRAG, POINTS_VERT, RING_FRAG } from '../glsl'
import { particleSeeds, particleSphere, useScene, visibleCount } from '../sceneContext'
import { IMP_LOW } from '../dims'
import type { Layers } from '../bus'

const COUNTS = {
  high: { cells: 3600, substrate: 1500, product: 700 },
  low: { cells: 1300, substrate: 600, product: 300 },
}

/**
 * Visual particles for the three concentrations. None of them is a
 * literal cell count: each field shows a fraction of its particles equal
 * to the (damped) simulated quantity, so density tracks X, S and P.
 * All motion runs in the vertex shader on GPU-instanced geometry; the CPU
 * only updates a handful of uniforms per frame.
 */
function Culture({ layers }: { layers: Layers }) {
  const { bus, shared, tier } = useScene()
  const pr = useThree((s) => s.viewport.dpr)
  const n = COUNTS[tier]

  const res = useMemo(() => {
    const base = {
      uLevelY: shared.uLevelY,
      uBaseY: shared.uBaseY,
      uRad: shared.uRad,
      uTime: shared.uTime,
      uImpY: { value: IMP_LOW },
    }

    // Biomass: instanced rod-shaped (bacillus-like) ellipsoids, lit.
    const cellSeeds = particleSeeds(n.cells, 11)
    const cellGeo = particleSphere(tier === 'high' ? 1 : 0)
    cellGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(cellSeeds.A, 4))
    cellGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(cellSeeds.B, 4))
    cellGeo.instanceCount = n.cells
    const cellMat = new THREE.ShaderMaterial({
      vertexShader: CELL_VERT,
      fragmentShader: CELL_FRAG,
      uniforms: {
        ...base,
        uDensity: { value: 0 },
        uScale: { value: 0.0125 },
        uSigma: { value: 0.3 },
        uCellColor: { value: new THREE.Color('#f2b347') },
        uLiquid: shared.uColor,
        uKeyDir: shared.uKeyDir,
        uFade: shared.uFade,
      },
      transparent: true,
      depthWrite: false,
    })

    const points = (count: number, seed: number, frag: string, color: string, size: number, speed: number, alpha: number) => {
      const s = particleSeeds(count, seed)
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
      g.setAttribute('aA', new THREE.BufferAttribute(s.A, 4))
      g.setAttribute('aB', new THREE.BufferAttribute(s.B, 4))
      const m = new THREE.ShaderMaterial({
        vertexShader: POINTS_VERT,
        fragmentShader: frag,
        uniforms: {
          ...base,
          uDensity: { value: 0 },
          uSize: { value: size },
          uPR: { value: 1 },
          uSigma: { value: 0.3 },
          uSpeed: { value: speed },
          uColor: { value: new THREE.Color(color) },
          uAlpha: { value: alpha },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      return { g, m }
    }

    const substrate = points(n.substrate, 23, GLOW_FRAG, '#46e0c8', 21, 0.4, 0.6)
    const product = points(n.product, 37, RING_FRAG, '#f0805f', 42, 0.28, 0.75)
    return { cellGeo, cellMat, substrate, product }
  }, [shared, tier, n])

  useEffect(
    () => () => {
      res.cellGeo.dispose()
      res.cellMat.dispose()
      res.substrate.g.dispose()
      res.substrate.m.dispose()
      res.product.g.dispose()
      res.product.m.dispose()
    },
    [res]
  )

  useFrame(() => {
    const { live } = bus
    // Particles are seen through less culture than the bulk colour implies:
    // a softer extinction keeps the nearest cells legible in dense broth.
    const sigma = (0.22 + 3.6 * live.turbidity) * 0.6
    const cells = layers.biomass ? live.cells : 0
    const substrate = layers.substrate ? live.substrate : 0
    const product = layers.product ? live.product * 0.9 : 0
    const cu = res.cellMat.uniforms
    cu.uDensity.value = cells
    cu.uSigma.value = sigma
    res.cellGeo.instanceCount = visibleCount(n.cells, cells)
    const su = res.substrate.m.uniforms
    su.uDensity.value = substrate
    su.uSigma.value = sigma * 1.1
    su.uPR.value = pr
    res.substrate.g.setDrawRange(0, visibleCount(n.substrate, substrate))
    const pu = res.product.m.uniforms
    pu.uDensity.value = product
    pu.uSigma.value = sigma * 1.1
    pu.uPR.value = pr
    res.product.g.setDrawRange(0, visibleCount(n.product, product))
  })

  return (
    <group>
      <mesh geometry={res.cellGeo} material={res.cellMat} renderOrder={10} frustumCulled={false} />
      <points geometry={res.substrate.g} material={res.substrate.m} renderOrder={11} frustumCulled={false} />
      <points geometry={res.product.g} material={res.product.m} renderOrder={11} frustumCulled={false} />
    </group>
  )
}

export default memo(Culture)
