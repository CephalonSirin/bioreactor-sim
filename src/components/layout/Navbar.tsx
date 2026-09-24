import { memo, useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { hrefFor, navigate } from '../../hooks/useHashRoute'
import type { Route } from '../../hooks/useHashRoute'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'
import NavMenu from './NavMenu'
import Logo from './Logo'
import ReactorGlyph from '../viz/ReactorGlyph'
import { LEARN_TOPICS } from '../../content/topics'
import { EXPERIMENT_CODE } from '../../content/experiments'
import { PRESETS } from '../../simulation/presets'
import type { Preset } from '../../simulation/presets'
import type { ReactorType } from '../../simulation/types'

interface NavbarProps {
  route: Route
  onLaunchReactor: (type: ReactorType) => void
  onRunPreset: (preset: Preset) => void
}

const MODES: { type: ReactorType; name: string; note: string }[] = [
  { type: 'batch', name: 'Batch', note: 'Closed vessel, no flow. Grows until the substrate runs out.' },
  { type: 'fedbatch', name: 'Fed-batch', note: 'Feed in, nothing out. Volume rises and depletion is delayed.' },
  { type: 'cstr', name: 'CSTR', note: 'Feed in, culture out. Steady state below D_crit, washout above.' },
]
const MODE_NAME: Record<ReactorType, string> = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' }

function Navbar({ route, onLaunchReactor, onRunPreset }: NavbarProps) {
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

  const launch = (type: ReactorType, close: () => void) => {
    close()
    setOpen(false)
    onLaunchReactor(type)
    navigate('lab')
  }
  const run = (p: Preset, close: () => void) => {
    close()
    setOpen(false)
    onRunPreset(p)
    navigate('lab', p.id)
  }

  return (
    <header
      className={`site-nav sticky top-0 z-40 border-b bg-canvas/90 backdrop-blur-[10px] transition-[border-color,background-color] duration-200 ${
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

        <div ref={box} className="relative hidden h-full items-center md:flex">
          <NavMenu id="lab" label="Lab" active={route === 'lab'} panelClassName="w-[360px]">
            {(close) => (
              <div className="p-1.5">
                <p className="px-2.5 pb-1 pt-1.5 text-micro font-medium text-ink-3">Open the Lab in</p>
                {MODES.map((m, i) => (
                  <button key={m.type} type="button" onClick={() => launch(m.type, close)} className="menu-item stagger-in group !items-start !gap-3" style={{ ['--i' as string]: i }}>
                    <ReactorGlyph type={m.type} className="!h-9 !w-11 shrink-0 !text-ink-3 transition-colors group-hover:!text-ink" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{m.name}</span>
                      <span className="block text-label leading-snug text-ink-3">{m.note}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </NavMenu>

          <NavMenu id="experiments" label="Experiments" active={route === 'experiments'} align="center" panelClassName="w-[640px]">
            {(close) => (
              <div>
                <div className="grid grid-cols-3 gap-1 p-1.5">
                  {(['batch', 'fedbatch', 'cstr'] as ReactorType[]).map((type, col) => (
                    <div key={type} className="stagger-in" style={{ ['--i' as string]: col }}>
                      <p className="flex items-center gap-2 px-2.5 pb-1 pt-1.5 text-micro font-medium text-ink-3">
                        <ReactorGlyph type={type} className="h-4 w-5 text-ink-3" />
                        {MODE_NAME[type]}
                      </p>
                      {PRESETS.filter((p) => p.reactorType === type).map((p) => (
                        <button key={p.id} type="button" onClick={() => run(p, close)} className="menu-item !gap-2 !py-1.5">
                          <span className="num w-8 shrink-0 font-mono text-micro text-ink-4">{EXPERIMENT_CODE[p.id]}</span>
                          <span className="truncate">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <a href={hrefFor('experiments')} onClick={close} className="group flex items-center justify-between border-t border-line px-4 py-2.5 text-label text-ink-2 transition-colors hover:bg-canvas hover:text-ink">
                  Objectives, mechanisms and previews in the archive
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </div>
            )}
          </NavMenu>

          <NavMenu id="learn" label="Learn" active={route === 'learn'} align="center" panelClassName="w-[440px]">
            {(close) => (
              <div className="grid grid-cols-2 gap-x-1 p-1.5">
                {LEARN_TOPICS.map((t, i) => (
                  <a key={t.id} href={hrefFor('learn', t.id)} onClick={close} className="menu-item stagger-in !gap-2 !py-1.5" style={{ ['--i' as string]: Math.floor(i / 2) }}>
                    <span className="num w-4 shrink-0 font-mono text-micro text-ink-4">{i + 1}</span>
                    <span className="truncate">{t.title}</span>
                  </a>
                ))}
              </div>
            )}
          </NavMenu>

          <a
            href={hrefFor('methodology')}
            data-active={route === 'methodology'}
            aria-current={route === 'methodology' ? 'page' : undefined}
            className={`relative flex h-full items-center px-3 text-ui font-medium transition-colors duration-150 ${route === 'methodology' ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            Methodology
          </a>
          <span ref={pill} aria-hidden="true" className="absolute bottom-[-1px] left-0 h-[1.5px] bg-ink transition-[transform,width] duration-[250ms] ease-out" />
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
            <div className="max-h-[calc(100svh-var(--nav-h))] overflow-y-auto border-t border-line px-4 pb-6 pt-1">
              <ul>
                {[
                  { id: 'home' as Route, label: 'Home' },
                  { id: 'lab' as Route, label: 'Lab' },
                  { id: 'experiments' as Route, label: 'Experiments' },
                  { id: 'learn' as Route, label: 'Learn' },
                  { id: 'methodology' as Route, label: 'Methodology' },
                ].map((l) => (
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
              <p className="mb-2 mt-5 text-micro font-medium text-ink-3">Open the Lab in</p>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button key={m.type} type="button" tabIndex={open ? 0 : -1} onClick={() => launch(m.type, () => undefined)} className="flex flex-col items-center gap-1 rounded-md border border-line bg-surface py-2.5 text-label font-medium text-ink">
                    <ReactorGlyph type={m.type} className="h-7 w-9 text-ink-2" />
                    {m.name}
                  </button>
                ))}
              </div>
              <p className="mb-1 mt-5 text-micro font-medium text-ink-3">Experiments</p>
              <ul>
                {PRESETS.map((p) => (
                  <li key={p.id}>
                    <button type="button" tabIndex={open ? 0 : -1} onClick={() => run(p, () => undefined)} className="flex w-full items-center gap-3 py-2 text-left text-ui text-ink-2">
                      <span className="num w-9 font-mono text-micro text-ink-4">{EXPERIMENT_CODE[p.id]}</span>
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default memo(Navbar)
