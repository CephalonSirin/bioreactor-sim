import { memo, useEffect, useRef } from 'react'
import { fmt } from '../../lib/format'

// One live query shared by every instance (they update ~30 times a second in playback).
let motionQuery: MediaQueryList | null | undefined
const reducedMotion = () => {
  if (motionQuery === undefined) motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  return motionQuery?.matches ?? false
}

interface AnimatedNumberProps {
  value: number | null | undefined
  digits?: number
  /** Approximate settle time in ms. Kept short so live playback still feels exact. */
  duration?: number
  className?: string
}

/**
 * Eases toward its target by writing straight to the DOM node, so number
 * animation never triggers React re-renders. A single rAF loop chases the
 * latest target (rather than restarting a tween on every update), which
 * keeps it correct even when the value changes every frame. Non-finite
 * values render as an em dash rather than NaN.
 */
function AnimatedNumber({ value, digits = 2, duration = 260, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef<number | null>(null)
  const target = useRef<number | null>(null)
  const raf = useRef<number | null>(null)
  const last = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const next = value !== null && value !== undefined && Number.isFinite(value) ? value : null
    target.current = next

    const reduce = reducedMotion()
    if (next === null || shown.current === null || reduce) {
      shown.current = next
      el.textContent = fmt(next, digits)
      return
    }
    if (raf.current !== null) return // loop already chasing the (updated) target

    const eps = 10 ** -(digits + 1)
    const tau = Math.max(duration / 3, 16)
    last.current = performance.now()
    const step = (now: number) => {
      raf.current = null
      const goal = target.current
      const cur = shown.current
      if (goal === null || cur === null) return
      // The first rAF timestamp can precede the performance.now() taken when
      // the loop started; a negative dt would step the value away from its target.
      const dt = Math.min(Math.max(now - last.current, 0), 100)
      last.current = now
      const v = cur + (goal - cur) * (1 - Math.exp(-dt / tau))
      const done = Math.abs(goal - v) < eps
      shown.current = done ? goal : v
      el.textContent = fmt(shown.current, digits)
      if (!done) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [value, digits, duration])

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    },
    []
  )

  return (
    <span ref={ref} className={className}>
      {fmt(value, digits)}
    </span>
  )
}

export default memo(AnimatedNumber)
