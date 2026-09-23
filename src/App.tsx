import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
const LabPage = lazy(() => import('./components/lab/LabPage'))
const LearnPage = lazy(() => import('./pages/LearnPage'))
const ExperimentsPage = lazy(() => import('./pages/ExperimentsPage'))
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'))
import { useSimulationEngine } from './hooks/useSimulationEngine'
import { navigate, useLocation } from './hooks/useHashRoute'
import { defaultConfigFor } from './simulation/presets'
import type { Preset } from './simulation/presets'
import type { ReactorType } from './simulation/types'

const MODE_NAME: Record<ReactorType, string> = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' }

const TITLES = {
  home: 'Bioreactor Lab — Interactive Biotechnology Laboratory',
  lab: 'Bioreactor Lab — Run batch, fed-batch and CSTR simulations',
  learn: 'Learn — Bioreactor kinetics explained | Bioreactor Lab',
  experiments: 'Experiment Gallery | Bioreactor Lab',
  methodology: 'Methodology — Equations and assumptions | Bioreactor Lab',
} as const

export default function App() {
  const { route, section } = useLocation()
  const engine = useSimulationEngine(defaultConfigFor('batch'), 'Batch · default')
  const [presenting, setPresenting] = useState(false)

  const { load, loadAndRun, compare } = engine

  const launchReactor = useCallback((type: ReactorType) => load(defaultConfigFor(type), `${MODE_NAME[type]} · default`), [load])
  const runPreset = useCallback((p: Preset) => loadAndRun(p.build(), p.label), [loadAndRun])
  const comparePresets = useCallback(
    (a: Preset, b: Preset) => {
      compare({ config: a.build(), label: a.label }, { config: b.build(), label: b.label })
      navigate('lab')
    },
    [compare]
  )

  // Page title per route; scroll to top on navigation unless an anchor is requested.
  useEffect(() => {
    document.title = TITLES[route]
    if (!section) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [route, section])

  // Presentation mode only exists in the Lab; sync with browser fullscreen when possible.
  useEffect(() => {
    if (route !== 'lab' && presenting) setPresenting(false)
  }, [route, presenting])

  const setPresentingMode = useCallback((on: boolean) => {
    setPresenting(on)
    try {
      if (on && !document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => undefined)
      else if (!on && document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
    } catch {
      /* fullscreen is optional */
    }
  }, [])

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {!presenting && <Navbar route={route} onLaunchReactor={launchReactor} onRunPreset={runPreset} />}

      <main id="main" key={route} className="flex-1 animate-page-in" tabIndex={-1}>
        <Suspense fallback={<div className="p-16 text-center font-mono text-sm text-muted" role="status">Loading…</div>}>
        {route === 'home' && <HomePage onLaunchReactor={launchReactor} onRunPreset={runPreset} />}
        {route === 'lab' && <LabPage engine={engine} presenting={presenting} onPresentingChange={setPresentingMode} />}
        {route === 'learn' && <LearnPage section={section} />}
        {route === 'experiments' && <ExperimentsPage section={section} onRun={(p) => { runPreset(p); navigate('lab') }} onCompare={comparePresets} />}
        {route === 'methodology' && <MethodologyPage />}
        </Suspense>
      </main>

      {!presenting && <Footer />}
    </div>
  )
}
