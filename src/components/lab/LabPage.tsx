import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Download, FileJson, FileSpreadsheet, Image as ImageIcon, Presentation, RotateCcw, X } from 'lucide-react'
import ReactorSelector from './ReactorSelector'
import ParameterPanel from './ParameterPanel'
import MetricCards from './MetricCards'
import SimulationControls from './SimulationControls'
import ChartPanel from './ChartPanel'
import InsightsPanel from './InsightsPanel'
import ScienceCard from './ScienceCard'
import Popover from '../ui/Popover'
import ReactorStage from '../viz3d/ReactorStage'
import { PHASE_LABEL, visualSnapshot } from '../viz3d/visualState'
import type { CulturePhase } from '../viz3d/visualState'
import type { CaptureFn } from '../viz3d/ReactorCanvas'
import { defaultConfigFor, PRESETS } from '../../simulation/presets'
import type { Preset } from '../../simulation/presets'
import { experimentToJson, exportFilename, trajectoryToCsv, downloadCsv, downloadJson } from '../../simulation/exportCsv'
import { downloadCanvasAsPng, downloadSvgAsPng } from '../../lib/exportImage'
import { hrefFor } from '../../hooks/useHashRoute'
import type { SimulationEngine } from '../../hooks/useSimulationEngine'
import type { ReactorType } from '../../simulation/types'

interface LabPageProps {
  engine: SimulationEngine
  presenting: boolean
  onPresentingChange: (on: boolean) => void
}

const MODE_NAME: Record<ReactorType, string> = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' }

const PHASE_TONE: Record<CulturePhase, string> = {
  initial: 'bg-ink-4',
  growth: 'bg-series-mu',
  limited: 'bg-series-x',
  stationary: 'bg-ink-3',
  steady: 'bg-accent',
  approach: 'bg-accent',
  dilution: 'bg-warn',
  washout: 'bg-danger',
}

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY', 'A'].includes(el.tagName) || el.isContentEditable)
}

function PanelHeading({ step, title, children }: { step: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="flex items-baseline gap-2 text-ui font-semibold text-ink">
        <span className="num font-mono text-micro font-normal text-ink-4">{step}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function LabPage({ engine, presenting, onPresentingChange }: LabPageProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const captureRef = useRef<CaptureFn | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const { config, runConfig, currentPoint, extents, running, playbackIndex } = engine

  const shownConfig = runConfig ?? config
  const duration = engine.chartPoints.length ? engine.chartPoints[engine.chartPoints.length - 1].t : config.settings.duration

  // Handlers stay referentially stable so the memoised panels skip the
  // ~30 re-renders per second that playback drives through this page.
  const { load, loadAndRun, fullResult, runLabel, metrics: runMetrics, label, modified } = engine
  const handleReactor = useCallback((type: ReactorType) => load(defaultConfigFor(type), `Default ${MODE_NAME[type].toLowerCase()}`), [load])
  const handlePreset = useCallback((p: Preset) => loadAndRun(p.build(), p.label), [loadAndRun])

  const loadedPreset = useMemo(() => PRESETS.find((p) => p.label === label), [label])
  const reference = useMemo(
    () => (loadedPreset && loadedPreset.reactorType === config.reactorType ? loadedPreset.build() : defaultConfigFor(config.reactorType)),
    [loadedPreset, config.reactorType]
  )
  const revert = useCallback(() => load(reference, label), [load, reference, label])

  // First visit: run the loaded experiment so the vessel is alive on arrival.
  const { hasResult, run } = engine
  useEffect(() => {
    if (!hasResult && !modified) run()
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const baseName = fullResult ? exportFilename(runLabel, fullResult.config.settings.duration, '') : ''
  const fileBase = baseName.replace(/\.$/, '')

  const guard = useCallback(async (fn: () => void | Promise<void>) => {
    try {
      setExportError(null)
      await fn()
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed.')
    }
  }, [])
  const handleCsv = useCallback(
    () =>
      guard(() => {
        if (!fullResult) return
        downloadCsv(exportFilename(runLabel, fullResult.config.settings.duration, 'csv'), trajectoryToCsv(fullResult))
      }),
    [guard, fullResult, runLabel]
  )
  const handleJson = useCallback(
    () =>
      guard(() => {
        if (!fullResult) return
        downloadJson(exportFilename(runLabel, fullResult.config.settings.duration, 'json'), experimentToJson(fullResult, runMetrics, runLabel))
      }),
    [guard, fullResult, runMetrics, runLabel]
  )
  // The playback point changes every tick; read it through a ref at click time.
  const pointRef = useRef(currentPoint)
  pointRef.current = currentPoint
  const handleImage = useCallback(
    () =>
      guard(async () => {
        const p = pointRef.current
        const t = p ? `t = ${p.t.toFixed(1)} h` : 'initial state'
        const name = `${fileBase || 'bioreactor'}_vessel.png`
        const caption = `${runLabel} · ${t} · Bioreactor Lab (educational model)`
        const frame = captureRef.current?.()
        if (frame) await downloadCanvasAsPng(frame, name, { caption })
        else if (svgRef.current) await downloadSvgAsPng(svgRef.current, name, { caption })
      }),
    [guard, fileBase, runLabel]
  )

  // Keyboard: Space = play/pause, R = run, P = classroom mode, Esc = exit.
  const { isPlaying, play, pause } = engine
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presenting) {
        onPresentingChange(false)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      if (e.key === ' ' && hasResult) {
        e.preventDefault()
        if (isPlaying) pause()
        else play()
      } else if (e.key.toLowerCase() === 'r') run()
      else if (e.key.toLowerCase() === 'p') onPresentingChange(!presenting)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, isPlaying, hasResult, play, pause, run, onPresentingChange])

  const snap = useMemo(() => visualSnapshot(currentPoint, shownConfig, extents), [currentPoint, shownConfig, extents])

  const presetMenu = (
    <Popover
      origin="top-left"
      role="menu"
      label="Experiments"
      panelClassName="w-[min(420px,calc(100vw-2rem))]"
      trigger={(t) => (
        <h1 className={`-ml-2 min-w-0 font-semibold tracking-[-0.02em] text-ink ${presenting ? 'text-3xl' : 'text-[22px] leading-tight'}`}>
          <button type="button" {...t} title="Choose an experiment" className="group flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-sunken">
            <span className="truncate">{engine.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-aria-expanded:rotate-180" aria-hidden="true" />
          </button>
        </h1>
      )}
    >
      {(close) => (
        <div className="menu max-h-[70vh] overflow-y-auto">
          {(['batch', 'fedbatch', 'cstr'] as ReactorType[]).map((type) => (
            <div key={type} className="py-1">
              <p className="px-2.5 pb-1 pt-1.5 text-micro font-medium text-ink-3">{MODE_NAME[type]}</p>
              {PRESETS.filter((p) => p.reactorType === type).map((p) => {
                const active = !modified && p.label === engine.label
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      handlePreset(p)
                    }}
                    className="menu-item !items-start"
                  >
                    <Check className={`mt-0.5 ${active ? '!text-ink' : '!text-transparent'}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium">{p.label}</span>
                      <span className="block text-label leading-snug text-ink-3">{p.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
          <a href={hrefFor('experiments')} className="menu-item border-t border-line !rounded-none !text-accent">
            Browse the experiment archive
          </a>
        </div>
      )}
    </Popover>
  )

  const exportMenu = (
    <Popover
      origin="top-right"
      role="menu"
      label="Export"
      panelClassName="w-60"
      trigger={(t) => (
        <button type="button" {...t} disabled={!hasResult} className="btn-secondary">
          <Download aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </button>
      )}
    >
      {(close) => (
        <div className="menu">
          {[
            { label: 'Trajectory', ext: 'CSV', icon: FileSpreadsheet, fn: handleCsv },
            { label: 'Experiment record', ext: 'JSON', icon: FileJson, fn: handleJson },
            { label: 'Vessel image', ext: 'PNG', icon: ImageIcon, fn: handleImage },
          ].map((it) => (
            <button
              key={it.ext}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                close()
                void it.fn()
              }}
            >
              <it.icon aria-hidden="true" />
              <span className="flex-1">{it.label}</span>
              <span className="font-mono text-micro text-ink-3">.{it.ext.toLowerCase()}</span>
            </button>
          ))}
          <p className="border-t border-line px-2.5 pb-1.5 pt-2 text-micro leading-snug text-ink-3">Figures download individually from each chart.</p>
        </div>
      )}
    </Popover>
  )

  const toolbar = (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <div className="min-w-0 flex-1 basis-[240px]">
          {presetMenu}
          <div className="flex items-center gap-2 text-label text-ink-3">
            <span>{MODE_NAME[config.reactorType]}</span>
            {modified ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-ink-2">Edited</span>
                <button type="button" onClick={revert} className="inline-flex items-center gap-1 rounded px-1 text-accent transition-colors hover:bg-accent-soft">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Revert
                </button>
              </>
            ) : loadedPreset ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{loadedPreset.description}</span>
              </>
            ) : null}
          </div>
        </div>
        <ReactorSelector value={config.reactorType} onChange={handleReactor} />
        <div className="flex items-center gap-2">
          {engine.baseline ? (
            <span className="inline-flex h-[34px] items-center gap-2 rounded-md border border-line bg-canvas pl-2.5 pr-1 text-label text-ink-2">
              <span className="swatch swatch-dashed text-ink-3" aria-hidden="true" />
              <span className="max-w-[10rem] truncate" title={engine.baseline.label}>
                Baseline: {engine.baseline.label}
              </span>
              <button type="button" onClick={engine.clearBaseline} className="icon-btn !h-6 !w-6" aria-label="Clear baseline" title="Clear baseline">
                <X className="!h-3.5 !w-3.5" aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button type="button" onClick={engine.setBaseline} disabled={!hasResult} className="btn-secondary" title="Keep this run as a dashed reference on the figures">
              Save as baseline
            </button>
          )}
          {exportMenu}
          <button
            type="button"
            onClick={() => onPresentingChange(!presenting)}
            className={presenting ? 'btn-primary' : 'icon-btn !h-[34px] !w-[34px] border !border-line-strong bg-surface'}
            aria-label={presenting ? 'Exit classroom mode' : 'Classroom mode'}
            title={presenting ? 'Exit (Esc)' : 'Classroom mode: larger vessel and numbers (P)'}
          >
            {presenting ? (
              <>
                Exit <kbd>Esc</kbd>
              </>
            ) : (
              <Presentation aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {exportError && (
        <p role="alert" className="mx-auto max-w-[1680px] px-4 pb-3 text-label text-danger sm:px-6">
          Export failed: {exportError}
        </p>
      )}
    </header>
  )

  const advisories = engine.warnings.length > 0 && (
    <ul className="mb-4 flex flex-col gap-2" aria-label="Parameter advisories">
      {engine.warnings.map((w, i) => (
        <li
          key={i}
          className={`pop-in rounded-md border px-3 py-2 text-label leading-snug ${w.level === 'warn' ? 'border-warn-line bg-warn-soft text-warn' : 'border-line bg-canvas text-ink-2'}`}
        >
          {w.message}
        </li>
      ))}
    </ul>
  )

  const stageHeight = presenting ? 'h-[min(72vh,820px)]' : 'h-[clamp(380px,58vh,640px)]'

  return (
    <div className="bg-canvas">
      {toolbar}

      <div className={`mx-auto grid max-w-[1680px] grid-cols-1 ${presenting ? '' : 'lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]'}`}>
        {!presenting && (
          <aside
            aria-label="Configure"
            className="order-2 border-b border-line bg-surface px-4 py-5 sm:px-6 lg:sticky lg:border-b-0 lg:top-[var(--nav-h)] lg:order-none lg:h-[calc(100vh-var(--nav-h))] lg:overflow-y-auto lg:border-r lg:px-5"
          >
            <PanelHeading step={1} title="Configure">
              <span className="ml-auto text-micro text-ink-3">Changes apply on the next run</span>
            </PanelHeading>
            <div className="mt-4">
              {advisories}
              <ParameterPanel config={config} reference={reference} onChange={engine.setConfig} />
            </div>
          </aside>
        )}

        <div className="contents min-w-0 lg:block">
          {engine.error && (
            <div role="alert" className="order-1 flex items-start justify-between gap-3 border-b border-danger-line bg-danger-soft px-4 py-3 text-ui text-danger sm:px-6">
              <span>
                <strong className="font-semibold">The simulation stopped.</strong> {engine.error} Adjust the parameters and run again.
              </span>
              <button type="button" onClick={engine.dismissError} className="btn-ghost btn-sm shrink-0 !text-danger">
                Dismiss
              </button>
            </div>
          )}

          {/* Workbench: vessel + transport, and the live measurements */}
          <section aria-label="Simulate and observe" className={`order-1 grid border-b border-line ${presenting ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
            <div className="min-w-0">
              <div className="relative bg-[#F1F1EE]">
                <div className="pointer-events-none absolute left-4 top-3.5 z-10 flex flex-col gap-0.5 sm:left-5">
                  <span className="flex items-center gap-2 text-label font-medium text-ink" role="status" aria-live="polite">
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${PHASE_TONE[snap.phase]}`} aria-hidden="true" />
                    {PHASE_LABEL[snap.phase]}
                  </span>
                  <span className="num font-mono text-micro text-ink-3">
                    t = {(currentPoint?.t ?? 0).toFixed(1)} h
                  </span>
                </div>
                <ReactorStage
                  variant="lab"
                  svgRef={svgRef}
                  captureRef={captureRef}
                  point={currentPoint}
                  config={shownConfig}
                  extents={extents}
                  playing={engine.isPlaying}
                  className={stageHeight}
                />
              </div>
              <div className="border-t border-line bg-surface px-4 py-4 sm:px-5">
                <SimulationControls
                  hasResult={engine.hasResult}
                  isPlaying={engine.isPlaying}
                  stale={engine.stale}
                  progress={engine.progress}
                  time={currentPoint?.t ?? 0}
                  duration={duration}
                  speed={engine.speed}
                  playbackIndex={playbackIndex}
                  pointCount={engine.chartPoints.length}
                  points={engine.chartPoints}
                  onRun={engine.run}
                  onPlay={engine.play}
                  onPause={engine.pause}
                  onReset={engine.reset}
                  onSeek={engine.seek}
                  onSpeedChange={engine.setSpeed}
                  large={presenting}
                  lead={
                    <h2 className="mr-2 hidden items-baseline gap-2 text-ui font-semibold text-ink sm:flex">
                      <span className="num font-mono text-micro font-normal text-ink-4">2</span>
                      Simulate
                    </h2>
                  }
                />
              </div>
            </div>

            <div className="border-t border-line bg-surface px-4 py-5 sm:px-6 xl:border-l xl:border-t-0 xl:px-5">
              <PanelHeading step={3} title="Observe">
                <span className="ml-auto text-micro text-ink-3">At the playback time</span>
              </PanelHeading>
              <div className="mt-3">
                <MetricCards point={currentPoint} config={shownConfig} running={running} index={playbackIndex} large={presenting} />
              </div>
              <p className="mt-5 border-t border-line pt-4 text-micro leading-relaxed text-ink-3">
                Vessel, measurements and figures read the same precomputed trajectory. Broth colour and particles follow <span className="math">X</span>, dots{' '}
                <span className="math">S</span>, rings <span className="math">P</span>. Bubbles and probes are illustrative; oxygen, pH and temperature are not simulated.
              </p>
            </div>
          </section>

          <section aria-labelledby="analyze-h" className="order-3 px-4 py-8 sm:px-6 lg:py-10">
            <div className="mb-6 flex items-baseline gap-3">
              <h2 id="analyze-h" className="flex items-baseline gap-2 text-ui font-semibold text-ink">
                <span className="num font-mono text-micro font-normal text-ink-4">4</span>
                Analyze
              </h2>
              <span className="text-micro text-ink-3">Figures draw as the run plays</span>
            </div>
            <ChartPanel
              chartPoints={engine.chartPoints}
              baselinePoints={engine.baseline?.chartPoints}
              baselineLabel={engine.baseline?.label ?? null}
              config={runConfig}
              playbackIndex={playbackIndex}
              fileBase={fileBase || 'bioreactor'}
              tall={presenting}
            />
          </section>

          <section aria-label="Results" className="order-4 border-t border-line px-4 py-10 sm:px-6">
            <InsightsPanel
              metrics={engine.metrics}
              interpretation={engine.interpretation}
              config={runConfig}
              runLabel={engine.runLabel}
              baseline={engine.baseline}
              large={presenting}
            />
          </section>

          {!presenting && (
            <section aria-label="Model for this run" className="order-5 border-t border-line px-4 py-10 sm:px-6">
              <ScienceCard reactorType={config.reactorType} label={engine.label} modified={modified} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
