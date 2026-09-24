import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { hrefFor } from '../../hooks/useHashRoute'
import type { Route } from '../../hooks/useHashRoute'

const OPEN_DELAY = 70
const CLOSE_DELAY = 160
const CLOSE_MS = 150

interface NavMenuProps {
  id: Route
  label: string
  active: boolean
  align?: 'left' | 'center' | 'right'
  panelClassName?: string
  children: (close: () => void) => ReactNode
}

/**
 * A navigation item with a dropdown panel. Hover intent (a short delay in
 * both directions) keeps the panel from flickering as the pointer crosses
 * the bar; click and keyboard work too. The panel grows from the trigger
 * (transitions.dev menu dropdown) and closes faster than it opens.
 */
export default function NavMenu({ id, label, active, align = 'left', panelClassName = '', children }: NavMenuProps) {
  const [state, setState] = useState<'closed' | 'open' | 'closing'>('closed')
  const wrap = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const panelId = useId()

  const clear = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }
  const open = useCallback(() => {
    clear()
    setState('open')
  }, [])
  const close = useCallback(() => {
    clear()
    setState((s) => (s === 'open' ? 'closing' : s))
    timer.current = window.setTimeout(() => setState((s) => (s === 'closing' ? 'closed' : s)), CLOSE_MS)
  }, [])

  const hoverOpen = () => {
    clear()
    if (state === 'open') return
    timer.current = window.setTimeout(open, OPEN_DELAY)
  }
  const hoverClose = () => {
    clear()
    timer.current = window.setTimeout(close, CLOSE_DELAY)
  }

  useEffect(() => {
    if (state !== 'open') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        wrap.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [state, close])

  useEffect(() => () => clear(), [])

  const isOpen = state === 'open'
  const pos = align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : '-left-2'
  const origin = align === 'right' ? 'top-right' : align === 'center' ? 'top-center' : 'top-left'

  return (
    <div
      ref={wrap}
      className="relative flex h-full items-center"
      data-active={active}
      onPointerEnter={(e) => e.pointerType === 'mouse' && hoverOpen()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hoverClose()}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) close()
      }}
    >
      <a
        href={hrefFor(id)}
        aria-current={active ? 'page' : undefined}
        className={`relative flex h-full items-center pl-3 pr-1 text-ui font-medium transition-colors duration-150 ${active || isOpen ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
      >
        {label}
      </a>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${label} menu`}
        onClick={() => (isOpen ? close() : open())}
        className={`mr-1 flex h-6 w-5 items-center justify-center rounded transition-colors duration-150 ${isOpen ? 'text-ink' : 'text-ink-4 hover:text-ink'}`}
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} aria-hidden="true" />
      </button>
      {/* Invisible bridge so the pointer can travel from the bar to the panel. */}
      <div className={`absolute left-0 right-0 top-full h-3 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden="true" />
      <div className={`absolute top-[calc(100%+6px)] z-50 ${pos}`}>
        <div
          id={panelId}
          data-origin={origin}
          aria-hidden={!isOpen}
          {...({ inert: isOpen ? undefined : '' } as object)}
          className={`t-dropdown menu !p-0 ${isOpen ? 'is-open' : state === 'closing' ? 'is-closing' : ''} ${panelClassName}`}
          style={state === 'closed' ? { visibility: 'hidden' } : undefined}
        >
          {state !== 'closed' && children(close)}
        </div>
      </div>
    </div>
  )
}
