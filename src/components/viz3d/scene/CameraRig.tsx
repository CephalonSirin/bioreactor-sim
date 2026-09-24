import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import { useScene } from '../sceneContext'
import { TARGET_Y } from '../dims'
import type { ReactorType } from '../../../simulation/types'

interface Pose {
  distance: number
  azimuth: number
  polar: number
}

const HOME: Record<ReactorType, Pose> = {
  batch: { distance: 11.2, azimuth: 0.62, polar: 1.25 },
  fedbatch: { distance: 13.2, azimuth: 0.5, polar: 1.24 },
  cstr: { distance: 13.6, azimuth: 0.62, polar: 1.24 },
}

function toXYZ({ distance, azimuth, polar }: Pose, ty = TARGET_Y): [number, number, number] {
  const s = Math.sin(polar)
  return [distance * s * Math.sin(azimuth), ty + distance * Math.cos(polar), distance * s * Math.cos(azimuth)]
}

const ease = (k: number) => 1 - Math.pow(1 - k, 4)

interface LabCameraProps {
  mode: ReactorType
  interactive: boolean
  compact: boolean
  entrance: 'hero' | 'normal' | 'none'
}

/**
 * Orbit camera for the Lab: damped rotate and zoom, no free pan, clamped
 * above the bench. Wheel zoom is only armed after the user clicks the
 * canvas so scrolling the page never gets hijacked. After a few idle
 * seconds it drifts gently around the home angle.
 */
export function LabCamera({ mode, interactive, compact, entrance }: LabCameraProps) {
  const { bus } = useScene()
  const ref = useRef<CameraControlsImpl>(null)
  const idle = useRef(0)
  const drift = useRef(1)
  const gl = useThree((s) => s.gl)
  const home = HOME[mode]
  const homeDist = home.distance * (compact ? 1.3 : 1)
  // Narrow screens: aim a little higher so the HUD sits over empty space.
  const ty = TARGET_Y + (compact ? 0.5 : 0)

  // Entrance: fly out from inside the hero's framing (or a slight push-in).
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const target: [number, number, number] = [0, ty, 0]
    const end = toXYZ({ ...home, distance: homeDist }, ty)
    if (bus.reduced || entrance === 'none') {
      c.setLookAt(...end, ...target, false)
      return
    }
    const start =
      entrance === 'hero'
        ? toXYZ({ distance: 4.2, azimuth: home.azimuth - 0.25, polar: 1.3 }, ty)
        : toXYZ({ distance: homeDist * 1.25, azimuth: home.azimuth + 0.35, polar: home.polar - 0.12 }, ty)
    c.setLookAt(...start, ...target, false)
    c.smoothTime = entrance === 'hero' ? 0.75 : 0.6
    void c.setLookAt(...end, ...target, true)
    const t = window.setTimeout(() => {
      if (ref.current) ref.current.smoothTime = 0.25
    }, 2200)
    return () => window.clearTimeout(t)
    // Entrance runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mode change: glide to that mode's framing (wider when pumps appear).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const c = ref.current
    if (!c) return
    c.smoothTime = 0.5
    idle.current = 0
    void c.setLookAt(...toXYZ({ ...home, distance: homeDist }, ty), 0, ty, 0, !bus.reduced)
  }, [mode, homeDist, home, bus, ty])

  // Public API for the DOM layer (reset button, keyboard).
  useEffect(() => {
    bus.camera = {
      reset: (smooth = true) => {
        const c = ref.current
        if (!c) return
        c.smoothTime = 0.45
        idle.current = 0
        void c.setLookAt(...toXYZ({ ...home, distance: homeDist }, ty), 0, ty, 0, smooth && !bus.reduced)
      },
      rotate: (az, polar) => {
        idle.current = 0
        void ref.current?.rotate(az, polar, !bus.reduced)
      },
      dolly: (amount) => {
        idle.current = 0
        void ref.current?.dolly(amount, !bus.reduced)
      },
    }
    return () => {
      bus.camera = null
      bus.cameraBusy = false
    }
  }, [bus, home, homeDist, ty])

  // Wheel zoom only after an explicit click inside the canvas.
  useEffect(() => {
    const c = ref.current
    const el = gl.domElement
    if (!c) return
    const A = CameraControlsImpl.ACTION
    c.mouseButtons.wheel = A.NONE
    c.mouseButtons.right = A.NONE
    c.mouseButtons.middle = A.NONE
    c.touches.one = interactive ? A.TOUCH_ROTATE : A.NONE
    c.touches.two = interactive ? A.TOUCH_DOLLY : A.NONE
    c.touches.three = A.NONE
    c.enabled = true
    el.style.touchAction = interactive ? 'none' : 'pan-y'
    const arm = () => (c.mouseButtons.wheel = A.DOLLY)
    const disarm = () => (c.mouseButtons.wheel = A.NONE)
    // Wheel zoom emits no 'controlstart'; count it as interaction too.
    const onControl = () => (idle.current = Math.min(idle.current, 0))
    el.addEventListener('pointerdown', arm)
    el.addEventListener('pointerleave', disarm)
    c.addEventListener('control', onControl)
    return () => {
      el.removeEventListener('pointerdown', arm)
      el.removeEventListener('pointerleave', disarm)
      c.removeEventListener('control', onControl)
    }
  }, [gl, interactive])

  useFrame((_, dt) => {
    const c = ref.current
    if (!c) return
    idle.current += dt
    // Interaction and transitions render at full rate; the idle drift is slow
    // enough that the frame pacer can show it at its idle rate.
    bus.cameraBusy = c.active && idle.current < 6
    if (bus.reduced || idle.current < 6) return
    // Gentle presentation drift, ping-ponging within ±0.45 rad of home.
    const off = c.azimuthAngle - home.azimuth
    if (off > 0.45) drift.current = -1
    else if (off < -0.45) drift.current = 1
    c.azimuthAngle += dt * 0.035 * drift.current * Math.min((idle.current - 6) / 3, 1)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={5}
      maxDistance={17}
      minPolarAngle={0.35}
      maxPolarAngle={1.5}
      draggingSmoothTime={0.12}
      onStart={() => (idle.current = -4)}
    />
  )
}

/**
 * Hero camera: no orbit controls (the page must scroll freely). A slow
 * cinematic dolly-in on load, subtle pointer parallax, a breathing drift,
 * and a push into the vessel when the visitor heads into the Lab.
 */
export function HeroCamera() {
  const { bus } = useScene()
  const camera = useThree((s) => s.camera)
  const start = useRef<number | null>(null)
  const leaveAt = useRef<number | null>(null)
  const par = useRef({ x: 0, y: 0 })
  const home: Pose = { distance: 12.6, azimuth: 0.58, polar: 1.27 }

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (start.current === null) start.current = t
    const k = bus.reduced ? 1 : ease(Math.min((t - start.current) / 3.2, 1))
    par.current.x += (bus.pointer.x - par.current.x) * (1 - Math.exp(-dt * 3))
    par.current.y += (bus.pointer.y - par.current.y) * (1 - Math.exp(-dt * 3))
    const motion = bus.reduced ? 0 : 1

    let distance = 21 + (home.distance - 21) * k
    let azimuth = home.azimuth + (1 - k) * 0.9 + motion * (par.current.x * 0.35 + Math.sin(t * 0.11) * 0.1)
    const polar = home.polar - (1 - k) * 0.28 + motion * par.current.y * 0.12
    if (bus.leaving) {
      if (leaveAt.current === null) leaveAt.current = t
      const l = ease(Math.min((t - leaveAt.current) / 0.7, 1))
      distance += (4.2 - distance) * l
      azimuth -= 0.25 * l
    }
    const [x, y, z] = toXYZ({ distance, azimuth, polar })
    camera.position.set(x, y, z)
    camera.lookAt(0, TARGET_Y + (1 - k) * 0.4, 0)
  })
  return null
}
