import { useCallback, useEffect, useRef, useState } from 'react'
import ReactorSelector from './ReactorSelector'
import ParameterPanel from './ParameterPanel'
import PresetChips from './PresetChips'
import MetricCards from './MetricCards'
import SimulationControls from './SimulationControls'
import ChartPanel from './ChartPanel'
import InsightsPanel from './InsightsPanel'
import ScienceCard from './ScienceCard'
import ReactorStage from '../viz3d/ReactorStage'
import type { CaptureFn } from '../viz3d/ReactorCanvas'
import { defaultConfigFor, PRESETS } from '../../simulation/presets'
import type { Preset } from '../../simulation/presets'
import { experimentToJson, exportFilename, trajectoryToCsv, downloadCsv, downloadJson } from '../../simulation/exportCsv'
import { downloadCanvasAsPng, downloadSvgAsPng } from '../../lib/exportImage'
import type { SimulationEngine } from '../../hooks/useSimulationEngine'
import type { ReactorType } from '../../simulation/types'

interface LabPageProps {
  engine: SimulationEngine
  presenting: boolean
  onPresentingChange: (on: boolean) => void
}

const MODE_NAME: Record<ReactorType, string> = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' }

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY', 'A'].includes(el.tagName) || el.isContentEditable)
}

export default function LabPage({ engine, presenting, onPresentingChange }: LabPageProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const captureRef = useRef<CaptureFn | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const { config, runConfig, currentPoint, extents, running, playbackIndex } = engine

  const shownConfig = runConfig ?? config
  const duration = engine.chartPoints.length ? engine.chartPoints[engine.chartPoints.length - 1].t : config.settings.duration

  const handleReactor = (type: ReactorType) => engine.load(defaultConfigFor(type), `${MODE_NAME[type]} · default`)
  const handlePreset = (p: Preset) => engine.loadAndRun(p.build(), p.label)

  const baseName = engine.fullResult ? exportFilename(engine.runLabel, engine.fullResult.config.settings.duration, '') : ''
  const fileBase = baseName.replace(/\.$/, '')

  const guard = (fn: () => void | Promise<void>) => async () => {
    try {
      setExportError(null)
      await fn()
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed.')
    }
  }

  const handleCsv = guard(() => {
    if (!engine.fullResult) return
    downloadCsv(exportFilename(engine.runLabel, engine.fullResult.config.settings.duration, 'csv'), trajectoryToCsv(engine.fullResult))
  })
  const handleJson = guard(() => {
    if (!engine.fullResult) return
    downloadJson(
      exportFilename(engine.runLabel, engine.fullResult.config.settings.duration, 'json'),
      experimentToJson(engine.fullResult, engine.metrics, engine.runLabel)
    )
  })
  const handleImage = guard(async () => {
    const t = currentPoint ? `t = ${currentPoint.t.toFixed(1)} h` : 'initial state'
    const name = `${fileBase || 'bioreactor'}_reactor.png`
    const caption = `${engine.runLabel} · ${t} · Bioreactor Lab (educational model)`
    const frame = captureRef.current?.()
    if (frame) await downloadCanvasAsPng(frame, name, { caption })
    else if (svgRef.current) await downloadSvgAsPng(svgRef.current, name, { caption })
  })

  // Keyboard: Space = play/pause, R = run, P = presentation mode, Esc = exit.
  const { isPlaying, hasResult, play, pause, run } = engine
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

  const togglePresenting = useCallback(() => onPresentingChange(!presenting), [presenting, onPresentingChange])

  const banner = (
    <>
      {engine.error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-readout-product/60 bg-readout-product/10 px-4 py-3 text-sm text-readout-product">
          <span>
            <strong className="font-semibold">Simulation problem.</strong> {engine.error}
          </span>
          <button type="button" onClick={engine.dismissError} className="btn-ghost btn-sm shrink-0">
            Dismiss
          </button>
        </div>
      )}
      {engine.warnings.length > 0 && !presenting && (
        <ul className="flex flex-col gap-1.5" aria-label="Parameter advisories">
          {engine.warnings.map((w, i) => (
            <li
              key={i}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                w.level === 'warn' ? 'border-readout-biomass/40 bg-readout-biomass/10 text-readout-biomass' : 'border-ink-500 bg-ink-800/50 text-muted'
              }`}
            >
              {w.message}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const reactorCard = (
    <div className="glass frame flex flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <div className="eyebrow">Live reactor</div>
          <div className={`truncate font-display font-semibold ${presenting ? 'text-xl' : 'text-sm'}`}>{engine.runLabel}</div>
        </div>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-dim sm:block">drag to orbit · click + scroll to zoom</span>
      </div>
      <ReactorStage
        variant="lab"
        svgRef={svgRef}
        captureRef={captureRef}
        point={currentPoint}
        config={shownConfig}
        extents={extents}
        playing={engine.isPlaying}
        large={presenting}
        className={presenting ? 'h-[68vh] min-h-[480px]' : 'h-[440px] sm:h-[540px] xl:h-[600px]'}
      />
      <p className="px-4 pb-3 pt-2.5 text-[11px] leading-snug text-dim">
        Liquid level = volume · turbidity and amber cells = biomass X · teal glow = substrate S · coral rings = product P · gas = aeration + growth activity μX · streams = feed F and effluent D·V.
        Every element is drawn from the simulated state at this instant.
      </p>
    </div>
  )

  const controls = (
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
      onRun={engine.run}
      onPlay={engine.play}
      onPause={engine.pause}
      onReset={engine.reset}
      onSeek={engine.seek}
      onSpeedChange={engine.setSpeed}
      large={presenting}
    />
  )

  const metrics = (
    <MetricCards point={currentPoint} config={shownConfig} running={running} index={playbackIndex} large={presenting} />
  )

  const charts = (
    <ChartPanel
      chartPoints={engine.chartPoints}
      baselinePoints={engine.baseline?.chartPoints}
      baselineLabel={engine.baseline?.label ?? null}
      config={runConfig}
      playbackIndex={playbackIndex}
      fileBase={fileBase || 'bioreactor'}
      tall={presenting}
    />
  )

  const insights = (
    <InsightsPanel
      metrics={engine.metrics}
      interpretation={engine.interpretation}
      config={runConfig}
      runLabel={engine.runLabel}
      baseline={engine.baseline}
      onSetBaseline={engine.setBaseline}
      onClearBaseline={engine.clearBaseline}
      onExportCsv={handleCsv}
      onExportJson={handleJson}
      onExportImage={handleImage}
      exportError={exportError}
      large={presenting}
    />
  )

  if (presenting) {
    return (
      <div className="mx-auto flex max-w-[1700px] flex-col gap-5 px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="eyebrow">Classroom mode · Bioreactor Lab</div>
            <h1 className="font-display text-3xl font-semibold">{engine.label}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReactorSelector value={config.reactorType} onChange={handleReactor} compact />
            <button type="button" onClick={togglePresenting} className="btn-ghost">
              Exit <kbd className="rounded border border-ink-500 px-1 font-mono text-[10px] text-muted">Esc</kbd>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Load an experiment">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p)}
              aria-pressed={!engine.modified && engine.label === p.label}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                !engine.modified && engine.label === p.label ? 'border-aqua bg-aqua/15 text-aqua' : 'border-ink-500 text-muted hover:border-aqua/60 hover:text-paper'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {banner}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
          {reactorCard}
          <div className="flex flex-col gap-5">
            {metrics}
            {controls}
          </div>
        </div>
        {charts}
        {insights}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Interactive laboratory</div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Bioreactor Lab</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Choose a reactor, load an experiment or set your own parameters, then run it and watch the vessel, the numbers and the graphs evolve together.
          </p>
        </div>
        <button type="button" onClick={togglePresenting} className="btn-ghost" title="Larger visuals, fewer controls (P)">
          <span aria-hidden="true">⛶</span> Presentation mode
        </button>
      </header>

      <div className="mb-5">
        <ReactorSelector value={config.reactorType} onChange={handleReactor} />
      </div>
      <div className="mb-5 flex flex-col gap-2">{banner}</div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="order-2 flex min-w-0 flex-col gap-5 xl:order-none xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <PresetChips reactorType={config.reactorType} activeLabel={engine.label} modified={engine.modified} onSelect={handlePreset} />
          <ParameterPanel config={config} onChange={engine.setConfig} />
        </div>

        <div className="order-1 flex min-w-0 flex-col gap-5 xl:order-none xl:col-start-2 xl:row-start-1">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
            {reactorCard}
            <div className="flex flex-col gap-5">
              {metrics}
              {controls}
            </div>
          </div>
        </div>

        <div className="order-3 flex min-w-0 flex-col gap-5 xl:order-none xl:col-start-2 xl:row-start-2">
          {charts}
          {insights}
          <ScienceCard reactorType={config.reactorType} label={engine.label} modified={engine.modified} />
        </div>
      </div>
    </div>
  )
}
