import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Play } from 'lucide-react'
import Segmented from '../components/ui/Segmented'
import ReactorGlyph from '../components/viz/ReactorGlyph'
import { renderMath } from '../components/ui/mathText'
import { PRESETS } from '../simulation/presets'
import type { Preset } from '../simulation/presets'
import type { ReactorType, SimPoint } from '../simulation/types'
import { getPresetPreview } from '../lib/presetPreview'
import { EXPERIMENT_CODE, EXPERIMENT_META } from '../content/experiments'
import { FONT, INK, SERIES } from '../lib/palette'
import { niceAxis } from '../lib/axis'

interface ExperimentsPageProps {
  section: string | null
  onRun: (preset: Preset) => void
  onCompare: (a: Preset, b: Preset) => void
}

type Filter = 'all' | ReactorType
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'batch', label: 'Batch' },
  { value: 'fedbatch', label: 'Fed-batch' },
  { value: 'cstr', label: 'CSTR' },
]
const MODE_NAME: Record<ReactorType, string> = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' }

/** Preview figure of an experiment: its simulated X, S and P, on round axes. */
function PreviewFigure({ points, label }: { points: SimPoint[]; label: string }) {
  const f = useMemo(() => {
    const W = 420
    const H = 190
    const pad = { l: 40, r: 14, t: 10, b: 26 }
    const tMax = points[points.length - 1].t || 1
    const y = niceAxis(Math.max(...points.map((p) => Math.max(p.X, p.S, p.P)), 1e-9), 4)
    const x = niceAxis(tMax, 4)
    const sx = (t: number) => pad.l + (t / tMax) * (W - pad.l - pad.r)
    const sy = (v: number) => pad.t + (1 - v / y.max) * (H - pad.t - pad.b)
    const line = (k: 'X' | 'S' | 'P') => points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.t).toFixed(1)} ${sy(p[k]).toFixed(1)}`).join(' ')
    return { W, H, pad, sx, sy, yTicks: y.ticks, xTicks: x.ticks.filter((t) => t <= tMax + 1e-9), X: line('X'), S: line('S'), P: line('P') }
  }, [points])
  const lastX = f.xTicks[f.xTicks.length - 1]
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="w-full" role="img" aria-label={label} fontFamily={FONT.mono}>
      {f.yTicks.map((v, i) => (
        <g key={v}>
          <line x1={f.pad.l} x2={f.W - f.pad.r} y1={f.sy(v)} y2={f.sy(v)} stroke={i === 0 ? INK.lineStrong : '#ECECE8'} />
          <text x={f.pad.l - 6} y={f.sy(v) + 3.5} textAnchor="end" fontSize="10" fill={INK[3]}>
            {v}
          </text>
        </g>
      ))}
      {f.xTicks.map((v) => (
        <text key={v} x={f.sx(v)} y={f.H - 8} textAnchor={v === lastX && f.sx(v) > f.W - 30 ? 'end' : 'middle'} fontSize="10" fill={INK[3]}>
          {v === lastX ? `${v} h` : v}
        </text>
      ))}
      <text transform={`translate(10 ${f.pad.t + (f.H - f.pad.t - f.pad.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill={INK[3]} fontFamily={FONT.sans}>
        g/L
      </text>
      <path d={f.S} pathLength={1} className="draw-path" style={{ ['--i' as string]: 1 }} fill="none" stroke={SERIES.S} strokeWidth="1.6" />
      <path d={f.P} pathLength={1} className="draw-path" style={{ ['--i' as string]: 2 }} fill="none" stroke={SERIES.P} strokeWidth="1.6" />
      <path d={f.X} pathLength={1} className="draw-path" style={{ ['--i' as string]: 0 }} fill="none" stroke={SERIES.X} strokeWidth="1.9" />
    </svg>
  )
}

function Entry({
  preset,
  open,
  onToggle,
  selected,
  onSelect,
  onRun,
}: {
  preset: Preset
  open: boolean
  onToggle: () => void
  selected: boolean
  onSelect: () => void
  onRun: () => void
}) {
  const prev = getPresetPreview(preset)
  const meta = EXPERIMENT_META[preset.id]
  const code = EXPERIMENT_CODE[preset.id]
  return (
    <li id={`exp-${preset.id}`} className="t-acc scroll-mt-24 border-b border-line" data-open={open}>
      <div className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 sm:grid-cols-[4rem_minmax(0,1.3fr)_7rem_minmax(0,1.6fr)_auto] sm:gap-6">
        <label className="flex h-full cursor-pointer items-center py-5" title="Select to compare">
          <input type="checkbox" className="peer sr-only" checked={selected} onChange={onSelect} aria-label={`Select ${preset.label} for comparison`} />
          <span
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
              selected ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-transparent hover:border-ink-3'
            }`}
            aria-hidden="true"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="num ml-3 hidden font-mono text-label text-ink-3 sm:inline">{code}</span>
        </label>
        <button type="button" onClick={onToggle} aria-expanded={open} className="group flex min-w-0 items-center gap-3 py-5 text-left sm:col-span-3 sm:grid sm:grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,1.6fr)] sm:gap-6">
          <span className="min-w-0">
            <span className="block text-[16px] font-semibold tracking-[-0.01em] text-ink">{preset.label}</span>
            <span className="num block font-mono text-micro text-ink-3 sm:hidden">
              {code} · {MODE_NAME[preset.reactorType]}
            </span>
          </span>
          <span className="hidden items-center gap-2 text-ui text-ink-2 sm:flex">
            <ReactorGlyph type={preset.reactorType} className="h-7 w-9 shrink-0 text-ink-3" />
            {MODE_NAME[preset.reactorType]}
          </span>
          <span className="hidden text-ui leading-snug text-ink-3 sm:block">{renderMath(meta.objective)}</span>
        </button>
        <button type="button" onClick={onToggle} aria-label={open ? 'Collapse' : 'Expand'} className="icon-btn">
          <ChevronDown className="t-acc-chevron" aria-hidden="true" />
        </button>
      </div>

      <div className="t-acc-panel">
        <div className="t-acc-inner">
          <div className="grid gap-8 pb-8 pt-1 sm:ml-[calc(4rem+1.5rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="text-body leading-relaxed text-ink-2 sm:hidden">{renderMath(meta.objective)}</p>
              <div>
                <p className="t-label mb-1.5">Varied from the {MODE_NAME[preset.reactorType].toLowerCase()} defaults</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {meta.varied.map((v) => (
                    <li key={v} className="math text-[15px] text-ink">
                      {v === 'reference run' ? <span className="font-sans not-italic text-ui text-ink-2">None: this is the reference run</span> : renderMath(v)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="t-label mb-1.5">Mechanism</p>
                <p className="text-ui leading-relaxed text-ink-2">{preset.science}</p>
              </div>
              <div>
                <p className="t-label mb-1.5">Expected observation</p>
                <p className="text-ui leading-relaxed text-ink-2">{preset.watchFor}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={onRun} className="btn-primary">
                  <Play className="fill-current" aria-hidden="true" />
                  Run in the Lab
                </button>
                <button type="button" onClick={onSelect} aria-pressed={selected} className="btn-secondary">
                  {selected ? 'Selected for comparison' : 'Select to compare'}
                </button>
              </div>
            </div>
            {prev && (
              <figure className="w-full max-w-[480px]">
                <PreviewFigure key={open ? 'open' : 'closed'} points={prev.points} label={`Simulated biomass, substrate and product for ${preset.label}`} />
                <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-ink-3">
                  {[
                    ['Biomass', SERIES.X],
                    ['Substrate', SERIES.S],
                    ['Product', SERIES.P],
                  ].map(([n, c]) => (
                    <span key={n} className="flex items-center gap-1.5">
                      <span className="swatch" style={{ color: c }} />
                      {n}
                    </span>
                  ))}
                </figcaption>
                <dl className="mt-4 grid grid-cols-3 border-t border-line pt-3">
                  {[
                    ['Peak biomass', prev.metrics.maxBiomass, 'g/L'],
                    ['Final product', prev.metrics.finalProduct, 'g/L'],
                    ['Realised yield', prev.metrics.realizedYield, 'g/g'],
                  ].map(([k, v, u]) => (
                    <div key={k as string}>
                      <dt className="text-micro text-ink-3">{k}</dt>
                      <dd className="num mt-0.5 font-mono text-ui text-ink">
                        {(v as number).toFixed(2)} <span className="text-micro text-ink-3">{u}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </figure>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export default function ExperimentsPage({ section, onRun, onCompare }: ExperimentsPageProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Preset[]>([])
  const [open, setOpen] = useState<Set<string>>(() => new Set([section ?? PRESETS[0].id]))

  useEffect(() => {
    if (!section) return
    setOpen((o) => new Set(o).add(section))
    const el = document.getElementById(`exp-${section}`)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [section])

  const toggleSelect = (p: Preset) =>
    setSelected((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : prev.length >= 2 ? [prev[1], p] : [...prev, p]))
  const toggleOpen = (id: string) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const list = PRESETS.filter((p) => filter === 'all' || p.reactorType === filter)

  return (
    <div className="mx-auto max-w-page px-4 pb-16 pt-12 sm:px-6 lg:pt-16">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <h1 className="t-page max-w-[14ch]">Experiment archive</h1>
        <p className="max-w-prose text-body text-ink-2">
          Eight prepared parameter sets, each isolating one idea: substrate limitation, feed strategy, steady state or washout. The figures are real runs of the same model as the Lab. Open an entry to read it, run it, or select two to overlay.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-ink pb-3">
        <Segmented value={filter} options={FILTERS} onChange={setFilter} label="Filter by reactor mode" />
        <div className="flex items-center gap-3 text-label text-ink-3">
          <span className="num font-mono">
            {list.length} of {PRESETS.length}
          </span>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(open.size ? new Set() : new Set(list.map((p) => p.id)))}>
            {open.size ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="hidden grid-cols-[4rem_minmax(0,1.3fr)_7rem_minmax(0,1.6fr)_auto] gap-6 border-b border-line py-2.5 text-label text-ink-3 sm:grid">
        <span>No.</span>
        <span>Experiment</span>
        <span>Reactor</span>
        <span>Objective</span>
        <span className="w-8" />
      </div>
      <ul>
        {list.map((p) => (
          <Entry
            key={p.id}
            preset={p}
            open={open.has(p.id)}
            onToggle={() => toggleOpen(p.id)}
            selected={selected.some((s) => s.id === p.id)}
            onSelect={() => toggleSelect(p)}
            onRun={() => onRun(p)}
          />
        ))}
      </ul>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 transition-[transform,opacity] duration-300 ease-out ${
          selected.length ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        role="region"
        aria-label="Compare experiments"
        aria-hidden={!selected.length}
      >
        <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-pop">
          <p className="text-ui text-ink-2">
            {selected.length < 2 ? (
              <>
                <span className="font-medium text-ink">{selected[0]?.label}</span> selected. Choose one more.
              </>
            ) : (
              <>
                <span className="font-medium text-ink">{selected[0].label}</span> <span className="text-ink-3">(dashed)</span> against{' '}
                <span className="font-medium text-ink">{selected[1].label}</span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected([])} tabIndex={selected.length ? 0 : -1}>
              Clear
            </button>
            <button type="button" className="btn-primary btn-sm" disabled={selected.length < 2} onClick={() => onCompare(selected[0], selected[1])} tabIndex={selected.length ? 0 : -1}>
              Compare in the Lab <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
