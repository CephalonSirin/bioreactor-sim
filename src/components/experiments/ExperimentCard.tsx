import { memo, useMemo } from 'react'
import ReactorGlyph from '../viz/ReactorGlyph'
import { getPresetPreview } from '../../lib/presetPreview'
import type { Preset } from '../../simulation/presets'
import type { SimPoint } from '../../simulation/types'

interface ExperimentCardProps {
  preset: Preset
  onRun: (preset: Preset) => void
  /** Compare-selection state (Experiments page only). */
  selected?: boolean
  onToggleSelect?: (preset: Preset) => void
  compact?: boolean
}

const MODE_NAME = { batch: 'Batch', fedbatch: 'Fed-batch', cstr: 'CSTR' } as const

function Sparkline({ points, ariaLabel }: { points: SimPoint[]; ariaLabel: string }) {
  const paths = useMemo(() => {
    if (points.length < 2) return null
    const W = 240
    const H = 64
    const tMax = points[points.length - 1].t || 1
    const build = (key: 'X' | 'S') => {
      const max = Math.max(...points.map((p) => p[key]), 1e-9)
      return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${((p.t / tMax) * W).toFixed(1)} ${(H - 4 - (p[key] / max) * (H - 10)).toFixed(1)}`)
        .join(' ')
    }
    return { X: build('X'), S: build('S'), W, H }
  }, [points])
  if (!paths) return null
  return (
    <svg viewBox={`0 0 ${paths.W} ${paths.H}`} className="h-16 w-full" role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      <line x1="0" y1={paths.H - 3} x2={paths.W} y2={paths.H - 3} stroke="#22393f" />
      <path d={paths.S} fill="none" stroke="#46e0c8" strokeWidth="1.6" vectorEffect="non-scaling-stroke" opacity="0.85" />
      <path d={paths.X} fill="none" stroke="#f0b545" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function ExperimentCard({ preset, onRun, selected, onToggleSelect, compact = false }: ExperimentCardProps) {
  const preview = useMemo(() => getPresetPreview(preset), [preset])
  return (
    <article
      className={`glass group flex h-full flex-col p-4 transition duration-300 hover:-translate-y-0.5 hover:border-aqua/50 ${
        selected ? 'ring-1 ring-aqua shadow-glow' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-ink-500 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-aqua">
            {MODE_NAME[preset.reactorType]}
          </span>
          <h3 className="mt-2 font-display text-lg font-semibold leading-tight">{preset.label}</h3>
        </div>
        <ReactorGlyph type={preset.reactorType} className="h-12 w-14 shrink-0 opacity-90" />
      </div>
      <p className="text-[13px] leading-relaxed text-muted">{preset.description}</p>

      {preview && (
        <div className="well mt-3 px-3 pb-2 pt-2">
          <Sparkline points={preview.points} ariaLabel={`Simulated biomass (amber) and substrate (teal) for ${preset.label}`} />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
            <span>
              <span className="text-readout-biomass">━</span> biomass · <span className="text-aqua">━</span> substrate
            </span>
            <span>{preview.points[preview.points.length - 1].t.toFixed(0)} h</span>
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
          <p className="text-paper/85">{preset.science}</p>
          <p className="text-muted">
            <span className="font-mono text-[10px] uppercase tracking-wider text-aqua">Watch for </span>
            {preset.watchFor}
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <button type="button" onClick={() => onRun(preset)} className="btn-primary btn-sm">
          Run in the Lab
        </button>
        {onToggleSelect && (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onToggleSelect(preset)}
            className={`btn-sm rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected ? 'border-aqua bg-aqua/15 text-aqua' : 'border-ink-500 text-muted hover:border-aqua/60 hover:text-paper'
            }`}
          >
            {selected ? '✓ Selected to compare' : 'Compare…'}
          </button>
        )}
      </div>
    </article>
  )
}

export default memo(ExperimentCard)
