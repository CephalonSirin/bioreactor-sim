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
  home: 'Bioreactor Lab — Interactive bioprocess simulation',
  lab: 'Lab — Batch, fed-batch and CSTR simulation | Bioreactor Lab',
  learn: 'Learn — Bioreactor kinetics | Bioreactor Lab',
  experiments: 'Experiments | Bioreactor Lab',
  methodology: 'Methodology — Equations and assumptions | Bioreactor Lab',
} as const

export default function App() {
  const { route, section } = useLocation()
  const engine = useSimulationEngine(defaultConfigFor('batch'), 'Default batch')
  const [presenting, setPresenting] = useState(false)

  const { load, loadAndRun, compare } = engine

  const launchReactor = useCallback((type: ReactorType) => load(defaultConfigFor(type), `Default ${MODE_NAME[type].toLowerCase()}`), [load])
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
      {!presenting && <Navbar route={route} />}

      <main id="main" key={route} className="route-in flex-1 focus:outline-none" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center" role="status">
              <span className="t-meta">Loading…</span>
            </div>
          }
        >
        {route === 'home' && <HomePage onLaunchReactor={launchReactor} onRunPreset={runPreset} />}
        {route === 'lab' && <LabPage engine={engine} presenting={presenting} onPresentingChange={setPresentingMode} />}
        {route === 'learn' && <LearnPage section={section} />}
        {route === 'experiments' && <ExperimentsPage section={section} onRun={(p) => { runPreset(p); navigate('lab') }} onCompare={comparePresets} />}
        {route === 'methodology' && <MethodologyPage />}
        </Suspense>
      </main>

      {!presenting && route !== 'lab' && <Footer />}
    </div>
  )
}
