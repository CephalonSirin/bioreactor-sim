import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { dismiss, useToasts } from '../../lib/toast'
import type { ToastItem } from '../../lib/toast'

function Toast({ t }: { t: ToastItem }) {
  // Mount hidden, then rise into place (transitions.dev toast: slower in than out).
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [])
  const visible = shown && !t.leaving
  return (
    <li
      className="pointer-events-auto flex w-[min(360px,calc(100vw-2rem))] items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-pop"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
        filter: visible ? 'blur(0)' : 'blur(2px)',
        transition: t.leaving
          ? 'opacity 220ms var(--ease-smooth-out), transform 260ms var(--ease-smooth-out), filter 220ms ease'
          : 'opacity 350ms var(--ease-smooth-out), transform 400ms var(--ease-smooth-out), filter 300ms ease',
      }}
      role={t.tone === 'error' ? 'alert' : 'status'}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`} aria-hidden="true">
        {t.tone === 'ok' ? <Check className="check-draw h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ui font-medium text-ink">{t.title}</p>
        {t.detail && <p className="mt-0.5 truncate font-mono text-micro text-ink-3">{t.detail}</p>}
      </div>
      <button type="button" onClick={() => dismiss(t.id)} className="icon-btn -mr-1 -mt-0.5 !h-6 !w-6" aria-label="Dismiss">
        <X className="!h-3.5 !w-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

export default function Toaster() {
  const list = useToasts()
  return (
    <ol className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 max-lg:bottom-20" aria-live="polite">
      {list.map((t) => (
        <Toast key={t.id} t={t} />
      ))}
    </ol>
  )
}
