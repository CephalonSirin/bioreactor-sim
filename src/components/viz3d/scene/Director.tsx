import { useFrame } from '@react-three/fiber'
import { SRGBColorSpace } from 'three'
import { useScene } from '../sceneContext'
import { levelY } from '../dims'
import type { VisualTargets } from '../visualState'

/** Visual impeller speed (rad/s, ~1.5 rev/s). An operating setting, not a simulated state. */
const OMEGA = 9.5

const KEYS: (keyof Omit<VisualTargets, 'color'>)[] = [
  'turbidity',
  'cells',
  'substrate',
  'product',
  'gas',
  'activity',
  'feed',
  'outflow',
  'bottle',
  'harvest',
  'washout',
]

/**
 * Runs first every frame: eases the displayed state toward the simulated
 * target (a ~150 ms follower, so scrubbing feels immediate but never
 * pops), spins the impeller down when playback pauses, and advances the
 * process clock only while the run is playing.
 */
export default function Director() {
  const { bus, shared } = useScene()

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const { target, live } = bus
    const k = bus.snap ? 1 : 1 - Math.exp(-dt * 7)
    const kLevel = bus.snap ? 1 : 1 - Math.exp(-dt * 5)
    bus.snap = false

    let gap = 0
    for (const key of KEYS) {
      live[key] += (target[key] - live[key]) * k
      gap = Math.max(gap, Math.abs(target[key] - live[key]))
    }
    live.level += (target.level - live.level) * kLevel
    gap = Math.max(gap, Math.abs(target.level - live.level))
    for (let i = 0; i < 3; i++) {
      live.color[i] += (target.color[i] - live.color[i]) * k
      gap = Math.max(gap, Math.abs(target.color[i] - live.color[i]))
    }
    // All targets are 0..1 scaled; below this the remaining easing is invisible.
    bus.settled = gap < 1e-3

    const goal = bus.playing ? 1 : 0
    bus.motion += (goal - bus.motion) * (1 - Math.exp(-dt * (bus.playing ? 2.6 : 1.8)))
    if (Math.abs(goal - bus.motion) < 1e-3) bus.motion = goal
    bus.clock += dt * (bus.reduced ? 0 : bus.motion)
    bus.spin = (bus.spin + dt * bus.motion * OMEGA * (bus.reduced ? 0.3 : 1)) % (Math.PI * 2)

    shared.uLevelY.value = levelY(live.level)
    shared.uTime.value = bus.clock
    shared.uTurb.value = live.turbidity
    shared.uAgit.value = bus.motion
    shared.uGas.value = live.gas
    shared.uColor.value.setRGB(live.color[0], live.color[1], live.color[2], SRGBColorSpace)
  }, -1)

  return null
}
