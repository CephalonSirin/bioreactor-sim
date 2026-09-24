import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Origin = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right'

interface PopoverProps {
  /** Renders the trigger; spread the props onto a button. */
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-controls': string; 'aria-haspopup': 'true' }) => ReactNode
  children: (close: () => void) => ReactNode
  origin?: Origin
  className?: string
  panelClassName?: string
  role?: 'menu' | 'dialog'
  label?: string
}

const CLOSE_MS = 150

/**
 * A popover that grows from its trigger (transitions.dev menu dropdown):
 * scale 0.97 -> 1 over 250 ms on open, a quicker 150 ms close. The panel
 * stays mounted while closed so the close can animate; it is inert and
 * hidden from assistive tech until opened.
 */
export default function Popover({ trigger, children, origin = 'top-left', className = '', panelClassName = '', role = 'dialog', label }: PopoverProps) {
  const [state, setState] = useState<'closed' | 'open' | 'closing'>('closed')
  const wrap = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const id = useId()

  const close = useCallback(() => {
    setState((s) => (s === 'open' ? 'closing' : s))
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState((s) => (s === 'closing' ? 'closed' : s)), CLOSE_MS)
  }, [])
  const toggle = useCallback(() => {
    if (state === 'open') close()
    else {
      if (timer.current) window.clearTimeout(timer.current)
      setState('open')
    }
  }, [state, close])

  useEffect(() => {
    if (state !== 'open') return
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        wrap.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [state, close])

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  const open = state === 'open'
  const alignRight = origin.endsWith('right')
  const above = origin.startsWith('bottom')

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {trigger({ onClick: toggle, 'aria-expanded': open, 'aria-controls': id, 'aria-haspopup': 'true' })}
      <div
        id={id}
        role={role}
        aria-label={label}
        aria-hidden={!open}
        {...({ inert: open ? undefined : '' } as object)}
        data-origin={origin}
        className={`t-dropdown absolute z-50 ${above ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${alignRight ? 'right-0' : 'left-0'} ${
          open ? 'is-open' : state === 'closing' ? 'is-closing' : ''
        } ${panelClassName}`}
        style={state === 'closed' ? { visibility: 'hidden' } : undefined}
      >
        {state !== 'closed' && children(close)}
      </div>
    </div>
  )
}
