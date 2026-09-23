import { useEffect, useId, useRef, useState } from 'react'

/**
 * A small "i" affordance that reveals a short explanation on click or
 * focus. Click-to-toggle (rather than hover-only) so it works on touch
 * devices; Escape or an outside click closes it.
 */
export default function InfoTooltip({ children, label = 'More information' }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={wrap} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink-500 font-mono text-[10px] leading-none text-muted transition-colors hover:border-aqua hover:text-aqua"
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-6 z-30 w-64 -translate-x-1/2 rounded-md border border-ink-500 bg-ink-800 p-3 text-xs font-normal leading-relaxed text-paper shadow-glass"
        >
          {children}
        </span>
      )}
    </span>
  )
}
