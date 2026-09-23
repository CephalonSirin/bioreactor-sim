import { useEffect, useState } from 'react'
import ExperimentCard from '../components/experiments/ExperimentCard'
import Reveal from '../components/ui/Reveal'
import { PRESETS } from '../simulation/presets'
import type { Preset } from '../simulation/presets'
import type { ReactorType } from '../simulation/types'

interface ExperimentsPageProps {
  section: string | null
  onRun: (preset: Preset) => void
  onCompare: (a: Preset, b: Preset) => void
}

type Filter = 'all' | ReactorType
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All experiments' },
  { id: 'batch', label: 'Batch' },
  { id: 'fedbatch', label: 'Fed-batch' },
  { id: 'cstr', label: 'CSTR' },
]

export default function ExperimentsPage({ section, onRun, onCompare }: ExperimentsPageProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Preset[]>([])

  useEffect(() => {
    if (!section) return
    const el = document.getElementById(`exp-${section}`)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }, [section])

  const toggle = (p: Preset) =>
    setSelected((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : prev.length >= 2 ? [prev[1], p] : [...prev, p]))

  const list = PRESETS.filter((p) => filter === 'all' || p.reactorType === filter)

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-28 pt-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <div className="eyebrow">Experiment gallery</div>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Eight experiments, one model</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Each scenario is a carefully chosen parameter set that isolates one idea: substrate limitation, feed strategy, steady state or washout. The curves on the cards are real simulations of the same model that runs in the lab. Run any of them, or pick two and overlay their trajectories.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter experiments by reactor mode">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === f.id ? 'border-aqua bg-aqua/15 text-aqua' : 'border-ink-500 text-muted hover:border-aqua/60 hover:text-paper'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <div id={`exp-${p.id}`} className="h-full">
              <ExperimentCard preset={p} onRun={onRun} selected={selected.some((s) => s.id === p.id)} onToggleSelect={toggle} />
            </div>
          </Reveal>
        ))}
      </div>

      {selected.length > 0 && (
      <div
        className="fixed inset-x-0 bottom-0 z-30 animate-page-in border-t border-aqua/30 bg-ink-900/95 px-4 py-3 backdrop-blur"
        role="region"
        aria-label="Compare experiments"
      >
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {selected.length < 2 ? (
              <>
                <span className="text-paper">{selected[0]?.label}</span> selected. Choose one more to compare.
              </>
            ) : (
              <>
                Compare <span className="text-paper">{selected[0].label}</span> (dashed baseline) with <span className="text-paper">{selected[1].label}</span> (solid).
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected([])}>
              Clear
            </button>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={selected.length < 2}
             
              onClick={() => onCompare(selected[0], selected[1])}
            >
              Compare in the Lab
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
