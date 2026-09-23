import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { MAT } from '../materials'
import { useScene } from '../sceneContext'
import { HEAD_T, IMP_HIGH, IMP_LOW, IMP_R, Y0, Y_TOP } from '../dims'

const BLADES = 6
const BLADE_L = IMP_R / 2 // blade length D/4, half of it over the disc
const BLADE_H = (IMP_R * 2) / 5 // blade height D/5
const DISC_R = IMP_R * 0.75 // disc diameter 3D/4

function Rushton({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh material={MAT.steel}>
        <cylinderGeometry args={[0.065, 0.065, 0.12, 24]} />
      </mesh>
      <mesh material={MAT.steel}>
        <cylinderGeometry args={[DISC_R, DISC_R, 0.014, 48]} />
      </mesh>
      {Array.from({ length: BLADES }, (_, i) => {
        const a = (i / BLADES) * Math.PI * 2
        const r = IMP_R - BLADE_L / 2
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a, 0]} material={MAT.brushed}>
            <boxGeometry args={[BLADE_L, BLADE_H, 0.014]} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Shaft with two six-blade Rushton turbines. Only this group rotates;
 * the angle comes from the director, which spins down when paused.
 */
function Impeller() {
  const { bus } = useScene()
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = -bus.spin
  })
  const shaftBottom = Y0 + 0.4
  const shaftTop = Y_TOP + HEAD_T + 0.1
  return (
    <group ref={ref}>
      <mesh position={[0, (shaftBottom + shaftTop) / 2, 0]} material={MAT.steel}>
        <cylinderGeometry args={[0.034, 0.034, shaftTop - shaftBottom, 20]} />
      </mesh>
      <Rushton y={IMP_LOW} />
      <Rushton y={IMP_HIGH} />
    </group>
  )
}

export default memo(Impeller)
