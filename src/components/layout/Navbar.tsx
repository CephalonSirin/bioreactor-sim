import { memo, useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { hrefFor } from '../../hooks/useHashRoute'
import type { Route } from '../../hooks/useHashRoute'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'
import Logo from './Logo'

const LINKS: { id: Route; label: string }[] = [
  { id: 'lab', label: 'Lab' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'learn', label: 'Learn' },
  { id: 'methodology', label: 'Methodology' },
]

function Navbar({ route }: { route: Route }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { box, pill } = useSlidingIndicator<HTMLDivElement>(route)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setOpen(false), [route])

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-canvas/90 backdrop-blur-[10px] transition-[border-color,background-color] duration-200 ${
        scrolled || open ? 'border-line' : 'border-transparent'
      }`}
    >
      <a href="#main" className="sr-only rounded bg-ink px-3 py-1.5 text-white focus:not-sr-only focus:absolute focus:left-3 focus:top-2.5 focus:z-50">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-[var(--nav-h)] max-w-page items-center justify-between gap-6 px-4 sm:px-6">
        <a href={hrefFor('home')} className="-ml-1 flex items-center gap-2.5 rounded-md px-1 py-1" aria-label="Bioreactor Lab, home">
          <Logo className="h-[22px] w-[22px]" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Bioreactor Lab</span>
        </a>

        <div ref={box} className="relative hidden h-full items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = route === l.id
            return (
              <a
                key={l.id}
                href={hrefFor(l.id)}
                data-active={active}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-full items-center px-3 text-ui font-medium transition-colors duration-150 ${active ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
              >
                {l.label}
              </a>
            )
          })}
          <span
            ref={pill}
            aria-hidden="true"
            className="absolute bottom-[-1px] left-0 h-[1.5px] bg-ink transition-[transform,width] duration-[250ms] ease-out"
          />
        </div>

        <div className="flex items-center gap-2">
          {route !== 'lab' && (
            <a href={hrefFor('lab')} className="btn-primary btn-sm group hidden sm:inline-flex">
              Open the Lab
              <ArrowRight className="!h-3.5 !w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            className="icon-btn md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className="t-acc md:hidden" data-open={open}>
        <div className="t-acc-panel">
          <div className="t-acc-inner">
            <ul className="border-t border-line px-4 pb-4 pt-1">
              {[{ id: 'home' as Route, label: 'Home' }, ...LINKS].map((l) => (
                <li key={l.id}>
                  <a
                    href={hrefFor(l.id)}
                    tabIndex={open ? 0 : -1}
                    aria-current={route === l.id ? 'page' : undefined}
                    className={`flex items-center justify-between border-b border-line py-3 text-[15px] ${route === l.id ? 'font-medium text-ink' : 'text-ink-2'}`}
                  >
                    {l.label}
                    {route === l.id && <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default memo(Navbar)
