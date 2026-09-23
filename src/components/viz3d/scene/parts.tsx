import { useMemo } from 'react'
import * as THREE from 'three'

const UP = new THREE.Vector3(0, 1, 0)

interface RodProps {
  from: [number, number, number]
  to: [number, number, number]
  radius: number
  material: THREE.Material
  segments?: number
  renderOrder?: number
}

/** A cylinder spanning two points. */
export function Rod({ from, to, radius, material, segments = 16, renderOrder }: RodProps) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    const length = dir.length()
    return {
      position: a.add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
      length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.join(), to.join()])
  return (
    <mesh position={position} quaternion={quaternion} material={material} renderOrder={renderOrder}>
      <cylinderGeometry args={[radius, radius, length, segments]} />
    </mesh>
  )
}

interface TubeProps {
  points: [number, number, number][]
  radius: number
  material: THREE.Material
  segments?: number
  renderOrder?: number
  tension?: number
}

/** A smooth tube through control points (tubing, cables, sparger line). */
export function Tube({ points, radius, material, segments = 64, renderOrder, tension = 0.3 }: TubeProps) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', tension),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(points), tension]
  )
  return (
    <mesh material={material} renderOrder={renderOrder}>
      <tubeGeometry args={[curve, segments, radius, 10, false]} />
    </mesh>
  )
}
