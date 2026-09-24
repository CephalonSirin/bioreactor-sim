import { memo, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLASS_FRAG, GLASS_VERT } from '../glsl'
import { MAT, ledMaterial } from '../materials'
import { useScene } from '../sceneContext'
import { H, HEAD_R, HEAD_T, PORT_FEED, PORT_HARVEST, PORT_SPARGE, R_IN, R_OUT, SPARGE_R, SPARGE_Y, Y0, Y_TOP } from '../dims'
import { Rod, Tube } from './parts'

const HEAD_TOP = Y_TOP + HEAD_T
const LED_RUN = new THREE.Color('#2fb37a')
const LED_STOP = new THREE.Color('#e0a030')
const polar = (a: number, r: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r]

function useGlassMaterials() {
  const mats = useMemo(() => {
    const make = (side: THREE.Side, opacity: number, grad: number) =>
      new THREE.ShaderMaterial({
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_FRAG,
        uniforms: {
          uOpacity: { value: opacity },
          uGrad: { value: grad },
          uY0: { value: Y0 },
          uH: { value: H },
          uFade: { value: 1 },
          uTint: { value: new THREE.Color('#4d5a61') },
        },
        side,
        transparent: true,
        depthWrite: false,
      })
    return { back: make(THREE.BackSide, 0.03, 0), front: make(THREE.FrontSide, 0.045, 1) }
  }, [])
  useEffect(() => () => {
    mats.back.dispose()
    mats.front.dispose()
  }, [mats])
  return mats
}

/** Rushton-style drive, probes and head-plate hardware that never moves. */
function HeadPlate({ instruments }: { instruments: boolean }) {
  const { bus } = useScene()
  const led = useMemo(() => ledMaterial('#2fb37a'), [])
  useEffect(() => () => led.dispose(), [led])

  useFrame(() => {
    // Drive status LED: teal while the impeller turns, amber when stopped.
    led.color.copy(LED_STOP).lerp(LED_RUN, bus.motion)
  })

  const bolts = useMemo(() => Array.from({ length: 16 }, (_, i) => polar((i / 16) * Math.PI * 2 + 0.1, 1.1)), [])
  const fins = useMemo(() => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2), [])

  // Probes hang between baffles on the far side so they frame, not block, the view.
  const probes = [
    { a: -1.55, r: 0.68, len: 2.35, rad: 0.032, cap: MAT.capBlue, tip: true },
    { a: -2.0, r: 0.64, len: 2.15, rad: 0.032, cap: MAT.anodized, tip: false },
    { a: 2.95, r: 0.7, len: 2.0, rad: 0.016, cap: MAT.brushed, tip: false },
  ]

  return (
    <group>
      {/* Head plate and flange */}
      <mesh position={[0, Y_TOP + HEAD_T / 2, 0]} material={MAT.steel}>
        <cylinderGeometry args={[HEAD_R, HEAD_R, HEAD_T, 96]} />
      </mesh>
      <mesh position={[0, Y_TOP - 0.035, 0]} material={MAT.brushed}>
        <cylinderGeometry args={[1.11, 1.11, 0.07, 96]} />
      </mesh>
      {bolts.map(([x, z], i) => (
        <mesh key={i} position={[x, HEAD_TOP + 0.025, z]} material={MAT.brushed}>
          <cylinderGeometry args={[0.035, 0.035, 0.05, 6]} />
        </mesh>
      ))}

      {/* Motor, coupling and status ring */}
      <mesh position={[0, HEAD_TOP + 0.08, 0]} material={MAT.brushed}>
        <cylinderGeometry args={[0.12, 0.14, 0.16, 32]} />
      </mesh>
      <mesh position={[0, HEAD_TOP + 0.47, 0]} material={MAT.anodized}>
        <cylinderGeometry args={[0.3, 0.3, 0.62, 48]} />
      </mesh>
      {fins.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.31, HEAD_TOP + 0.47, Math.sin(a) * 0.31]} rotation={[0, -a, 0]} material={MAT.darkSteel}>
          <boxGeometry args={[0.04, 0.5, 0.012]} />
        </mesh>
      ))}
      <mesh position={[0, HEAD_TOP + 0.8, 0]} material={MAT.steel}>
        <cylinderGeometry args={[0.24, 0.3, 0.06, 48]} />
      </mesh>
      <mesh position={[0, HEAD_TOP + 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={led}>
        <torusGeometry args={[0.305, 0.011, 8, 64]} />
      </mesh>

      {/* Ports: feed, harvest, sparge inlet with sterile filter, septum, condenser */}
      {[PORT_FEED, PORT_HARVEST, PORT_SPARGE].map(([x, z], i) => (
        <mesh key={i} position={[x, HEAD_TOP + 0.05, z]} material={MAT.brushed}>
          <cylinderGeometry args={[0.055, 0.065, 0.1, 20]} />
        </mesh>
      ))}
      <mesh position={[PORT_SPARGE[0] - 0.05, HEAD_TOP + 0.36, PORT_SPARGE[1] - 0.06]} material={MAT.filter}>
        <cylinderGeometry args={[0.075, 0.075, 0.26, 24]} />
      </mesh>
      <Rod from={[PORT_SPARGE[0], HEAD_TOP + 0.08, PORT_SPARGE[1]]} to={[PORT_SPARGE[0] - 0.05, HEAD_TOP + 0.24, PORT_SPARGE[1] - 0.06]} radius={0.018} material={MAT.steel} />
      <mesh position={[0.05, HEAD_TOP + 0.06, 0.78]} material={MAT.capBlue}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 24]} />
      </mesh>
      {/* Exhaust condenser */}
      <group position={[0.72, HEAD_TOP, 0.32]}>
        <mesh position={[0, 0.34, 0]} material={MAT.glassSolid} renderOrder={25}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 24, 1, true]} />
        </mesh>
        <mesh position={[0, 0.34, 0]} material={MAT.steel}>
          <cylinderGeometry args={[0.025, 0.025, 0.62, 12]} />
        </mesh>
        <mesh position={[0, 0.66, 0]} material={MAT.brushed}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 24]} />
        </mesh>
        <mesh position={[0, 0.04, 0]} material={MAT.brushed}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
        </mesh>
      </group>

      {/* Tie rods holding the head plate to the base */}
      {[Math.PI / 2 + 0.25, Math.PI / 2 + 0.25 + (2 * Math.PI) / 3, Math.PI / 2 + 0.25 + (4 * Math.PI) / 3].map((a) => {
        const [x, z] = polar(a, 1.16)
        return (
          <group key={a}>
            <Rod from={[x, 0.3, z]} to={[x, HEAD_TOP + 0.12, z]} radius={0.022} material={MAT.steel} />
            <mesh position={[x, HEAD_TOP + 0.04, z]} material={MAT.brushed}>
              <cylinderGeometry args={[0.05, 0.05, 0.07, 6]} />
            </mesh>
          </group>
        )
      })}

      {/* Sparger: dip tube from the head plate down to a ring below the impeller */}
      <Tube
        points={[
          [PORT_SPARGE[0], Y_TOP, PORT_SPARGE[1]],
          [PORT_SPARGE[0], SPARGE_Y + 0.25, PORT_SPARGE[1]],
          [PORT_SPARGE[0] * 0.8, SPARGE_Y + 0.02, PORT_SPARGE[1] * 0.8],
          [...(() => {
            const a = Math.atan2(PORT_SPARGE[1], PORT_SPARGE[0])
            return [Math.cos(a) * SPARGE_R, SPARGE_Y, Math.sin(a) * SPARGE_R] as [number, number, number]
          })()],
        ]}
        radius={0.018}
        material={MAT.steel}
        tension={0.1}
      />
      <mesh position={[0, SPARGE_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.steel}>
        <torusGeometry args={[SPARGE_R, 0.018, 10, 64]} />
      </mesh>

      {/* Probes: pH (bulb tip), dissolved oxygen, temperature */}
      {instruments &&
        probes.map((p, i) => {
          const [x, z] = polar(p.a, p.r)
          const bottom = Y_TOP - p.len
          return (
            <group key={i}>
              <Rod from={[x, bottom, z]} to={[x, HEAD_TOP + 0.3, z]} radius={p.rad} material={MAT.steel} />
              {p.tip && (
                <mesh position={[x, bottom, z]} material={MAT.darkSteel}>
                  <sphereGeometry args={[p.rad * 1.05, 16, 12]} />
                </mesh>
              )}
              <mesh position={[x, HEAD_TOP + 0.36, z]} material={p.cap}>
                <cylinderGeometry args={[p.rad * 1.9, p.rad * 1.9, 0.16, 20]} />
              </mesh>
              <Tube
                points={[
                  [x, HEAD_TOP + 0.44, z],
                  [x * 1.05, HEAD_TOP + 0.62, z * 1.05 - 0.1],
                  [x * 1.3, HEAD_TOP + 0.5, z * 1.3 - 0.55],
                  [x * 1.6, 2.2, z * 1.6 - 1.1],
                  [x * 1.8, 0.02, z * 1.8 - 1.7],
                ]}
                radius={0.014}
                material={MAT.cable}
                segments={40}
              />
            </group>
          )
        })}
    </group>
  )
}

function Baffles() {
  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]
  const h = H - 0.25
  return (
    <group>
      {angles.map((a) => {
        const [x, z] = polar(a, R_IN - 0.13)
        return (
          <group key={a}>
            <mesh position={[x, Y0 + 0.08 + h / 2, z]} rotation={[0, -a, 0]} material={MAT.brushed}>
              <boxGeometry args={[0.2, h, 0.022]} />
            </mesh>
            <Rod from={[x * 0.97, Y0 + h - 0.1, z * 0.97]} to={[x * 0.97, Y_TOP, z * 0.97]} radius={0.012} material={MAT.steel} />
          </group>
        )
      })}
    </group>
  )
}

function Base() {
  const screen = useMemo(() => ledMaterial('#2fb37a'), [])
  const amber = useMemo(() => ledMaterial('#e0a030'), [])
  useEffect(() => () => {
    screen.dispose()
    amber.dispose()
  }, [screen, amber])
  const a = 0.93
  const [x, z] = polar(a, 1.315)
  return (
    <group>
      <mesh position={[0, 0.14, 0]} material={MAT.anodized}>
        <cylinderGeometry args={[1.32, 1.36, 0.28, 96]} />
      </mesh>
      <mesh position={[0, 0.29, 0]} material={MAT.darkSteel}>
        <cylinderGeometry args={[1.26, 1.32, 0.03, 96]} />
      </mesh>
      <mesh position={[0, Y0 - 0.035, 0]} material={MAT.rubber}>
        <cylinderGeometry args={[1.11, 1.18, 0.1, 96]} />
      </mesh>
      {/* Front readout strip on the base */}
      <group position={[x, 0.15, z]} rotation={[0, Math.PI / 2 - a, 0]}>
        <mesh material={MAT.screen}>
          <boxGeometry args={[0.62, 0.13, 0.02]} />
        </mesh>
        {[-0.22, -0.16, -0.1].map((dx, i) => (
          <mesh key={dx} position={[dx, 0, 0.012]} material={i === 2 ? amber : screen}>
            <circleGeometry args={[0.014, 12]} />
          </mesh>
        ))}
        <mesh position={[0.1, 0, 0.012]} material={screen}>
          <planeGeometry args={[0.28, 0.012]} />
        </mesh>
      </group>
    </group>
  )
}

/** Static vessel: base, glass, baffles, head plate, drive, sparger and probes. */
function Vessel({ instruments }: { instruments: boolean }) {
  const glass = useGlassMaterials()
  const wallH = H + 0.04
  return (
    <group>
      <Base />
      {/* Glass: far wall first, near wall last, so everything inside sits between them */}
      <mesh position={[0, Y0 - 0.02 + wallH / 2, 0]} material={glass.back} renderOrder={0}>
        <cylinderGeometry args={[R_OUT, R_OUT, wallH, 128, 1, true]} />
      </mesh>
      <mesh position={[0, Y0 - 0.02 + wallH / 2, 0]} material={glass.front} renderOrder={30}>
        <cylinderGeometry args={[R_OUT, R_OUT, wallH, 128, 1, true]} />
      </mesh>
      <Baffles />
      <HeadPlate instruments={instruments} />
    </group>
  )
}

export default memo(Vessel)
