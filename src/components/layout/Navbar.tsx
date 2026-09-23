import { useEffect, useRef, useState } from 'react'
import { ROUTES, hrefFor, navigate } from '../../hooks/useHashRoute'
import type { Route } from '../../hooks/useHashRoute'
import { LEARN_TOPICS } from '../../content/topics'
import { PRESETS } from '../../simulation/presets'
import type { Preset } from '../../simulation/presets'
import type { ReactorType } from '../../simulation/types'

interface NavbarProps {
  route: Route
  onLaunchReactor: (type: ReactorType) => void
  onRunPreset: (preset: Preset) => void
}

const MODES: { type: ReactorType; name: string; note: string }[] = [
  { type: 'batch', name: 'Batch', note: 'Closed system' },
  { type: 'fedbatch', name: 'Fed-batch', note: 'Feed in, nothing out' },
  { type: 'cstr', name: 'CSTR', note: 'Continuous flow' },
]

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <path d="M11 5 V21 Q11 27 16 27 Q21 27 21 21 V5 Z" fill="none" stroke="#46e0c8" strokeWidth="1.8" />
      <path d="M11.9 15 Q14 13.6 16 15 T20.1 15 V21 Q20.1 26 16 26 Q11.9 26 11.9 21 Z" fill="#46e0c8" opacity="0.45" />
      <circle cx="14.5" cy="21" r="1.1" fill="#f0b545" />
      <circle cx="17.6" cy="19.4" r="0.9" fill="#f0b545" />
      <circle cx="17" cy="23.2" r="0.8" fill="#f0b545" />
      <line x1="9" y1="5" x2="23" y2="5" stroke="#46e0c8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

interface MenuProps {
  id: Route
  label: string
  active: boolean
  children: (close: () => void) => React.ReactNode
  wide?: boolean
}

/** Hover / click / keyboard dropdown with an animated active underline. */
function DropdownItem({ id, label, active, children, wide }: MenuProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(true)
  }
  const hideSoon = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(false), 140)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <div className="flex items-center">
        <NavLink id={id} label={label} active={active} />
        <button
          type="button"
          aria-label={`${label} menu`}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((o) => !o)}
          className="-ml-2 px-1.5 py-2 text-muted transition-colors hover:text-aqua"
        >
          <svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
            <path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div
          className={`absolute left-0 top-full z-50 pt-2 ${wide ? 'w-[min(680px,92vw)]' : 'w-72'}`}
          style={{ animation: 'page-in 0.2s ease-out both' }}
        >
          <div className="glass p-3 shadow-glass" style={{ background: 'rgba(10,20,23,0.96)' }}>
            {children(() => setOpen(false))}
          </div>
        </div>
      )}
    </div>
  )
}

function NavLink({ id, label, active }: { id: Route; label: string; active: boolean }) {
  return (
    <a
      href={hrefFor(id)}
      aria-current={active ? 'page' : undefined}
      className={`group relative px-3 py-2 text-sm font-medium transition-colors ${active ? 'text-paper' : 'text-muted hover:text-paper'}`}
    >
      {label}
      <span
        className={`absolute inset-x-3 -bottom-px h-0.5 origin-left rounded-full bg-aqua transition-transform duration-300 ${
          active ? 'scale-x-100 shadow-[0_0_10px_rgba(70,224,200,0.8)]' : 'scale-x-0 group-hover:scale-x-50'
        }`}
      />
    </a>
  )
}

const menuItem =
  'flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-aqua/10 focus-visible:bg-aqua/10'

export default function Navbar({ route, onLaunchReactor, onRunPreset }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setMobileOpen(false), [route])

  const launch = (type: ReactorType, close: () => void) => {
    close()
    setMobileOpen(false)
    onLaunchReactor(type)
    navigate('lab')
  }
  const run = (preset: Preset, close: () => void) => {
    close()
    setMobileOpen(false)
    onRunPreset(preset)
    navigate('lab')
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled || mobileOpen ? 'border-ink-600/80 bg-ink-950/85 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <a href="#main" className="sr-only rounded bg-aqua px-3 py-1.5 text-ink-950 focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex max-w-[1560px] items-center justify-between px-4 py-2.5 sm:px-6">
        <a href={hrefFor('home')} className="flex items-center gap-2.5" aria-label="Bioreactor Lab home">
          <Logo />
          <span className="font-display text-[17px] font-semibold tracking-tight">
            Bioreactor<span className="text-aqua"> Lab</span>
          </span>
        </a>

        <div className="hidden items-center md:flex">
          <NavLink id="home" label="Home" active={route === 'home'} />

          <DropdownItem id="lab" label="Bioreactor Lab" active={route === 'lab'}>
            {(close) => (
              <div className="flex flex-col">
                <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-dim">Open the lab in…</p>
                {MODES.map((m) => (
                  <button key={m.type} type="button" className={menuItem} onClick={() => launch(m.type, close)}>
                    <span className="text-sm font-medium text-paper">{m.name} reactor</span>
                    <span className="text-xs text-muted">{m.note}</span>
                  </button>
                ))}
              </div>
            )}
          </DropdownItem>

          <DropdownItem id="learn" label="Learn" active={route === 'learn'}>
            {(close) => (
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {LEARN_TOPICS.map((t) => (
                  <a key={t.id} href={hrefFor('learn', t.id)} onClick={close} className={menuItem}>
                    <span className="text-sm text-paper">{t.title}</span>
                  </a>
                ))}
              </div>
            )}
          </DropdownItem>

          <DropdownItem id="experiments" label="Experiments" active={route === 'experiments'} wide>
            {(close) => (
              <div className="grid gap-3 sm:grid-cols-3">
                {MODES.map((m) => (
                  <div key={m.type}>
                    <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-aqua">{m.name}</p>
                    {PRESETS.filter((p) => p.reactorType === m.type).map((p) => (
                      <button key={p.id} type="button" className={menuItem} onClick={() => run(p, close)}>
                        <span className="text-[13px] text-paper">{p.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
                <a href={hrefFor('experiments')} onClick={close} className="col-span-full px-3 pt-1 font-mono text-xs text-aqua hover:underline">
                  Browse the full experiment gallery →
                </a>
              </div>
            )}
          </DropdownItem>

          <NavLink id="methodology" label="Methodology" active={route === 'methodology'} />
        </div>

        <div className="flex items-center gap-2">
          <a href={hrefFor('lab')} className="btn-primary btn-sm hidden sm:inline-flex">
            Enter the Lab
          </a>
          <button
            type="button"
            className="rounded-md border border-ink-500 p-2 text-paper md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg viewBox="0 0 20 14" className="h-4 w-5" aria-hidden="true">
              {mobileOpen ? (
                <path d="M3 1 L17 13 M17 1 L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M1 2 H19 M1 7 H19 M1 12 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="max-h-[80vh] overflow-y-auto border-t border-ink-600/80 px-4 pb-5 pt-2 md:hidden" style={{ animation: 'page-in 0.25s ease-out both' }}>
          <ul className="flex flex-col">
            {ROUTES.map((r) => (
              <li key={r.id}>
                <a
                  href={hrefFor(r.id)}
                  aria-current={route === r.id ? 'page' : undefined}
                  className={`flex items-center justify-between border-b border-ink-700 py-3 text-base ${route === r.id ? 'text-aqua' : 'text-paper'}`}
                >
                  {r.label}
                  {route === r.id && <span className="h-1.5 w-1.5 rounded-full bg-aqua" />}
                </a>
              </li>
            ))}
          </ul>
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-widest text-dim">Quick launch</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button key={m.type} type="button" onClick={() => launch(m.type, () => undefined)} className="btn-ghost btn-sm">
                {m.name}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-widest text-dim">Experiments</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => run(p, () => undefined)} className="rounded-full border border-ink-500 px-3 py-1 text-xs text-muted hover:border-aqua hover:text-aqua">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
