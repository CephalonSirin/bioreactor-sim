import { useLayoutEffect, useRef } from 'react'

/**
 * Moves an indicator element to sit under the active child. The first
 * placement (and any resize) snaps without a transition so the pill never
 * animates in from the left edge; clicks then tween on the CSS transition.
 */
export function useSlidingIndicator<T extends HTMLElement>(activeKey: unknown, selector = '[data-active="true"]') {
  const box = useRef<T>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const root = box.current
    const p = pill.current
    if (!root || !p) return
    const place = (animate: boolean) => {
      const el = root.querySelector<HTMLElement>(selector)
      if (!el) {
        p.style.opacity = '0'
        return
      }
      if (!animate) p.style.transition = 'none'
      p.style.opacity = '1'
      p.style.transform = `translateX(${el.offsetLeft}px)`
      p.style.width = `${el.offsetWidth}px`
      if (!animate) {
        void p.offsetWidth
        p.style.transition = ''
      }
    }
    place(placed.current)
    placed.current = true
    const ro = new ResizeObserver(() => place(false))
    ro.observe(root)
    return () => ro.disconnect()
  }, [activeKey, selector])

  return { box, pill }
}
