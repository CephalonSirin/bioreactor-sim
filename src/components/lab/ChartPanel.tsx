import { memo, useMemo, useState } from 'react'
import SeriesChart from './SeriesChart'
import type { ChartRow, RefLineDef, SeriesDef } from './SeriesChart'
import { cstrSteadyState } from '../../simulation/kinetics'
import type { ReactorConfig, SimPoint } from '../../simulation/types'

interface ChartPanelProps {
  /** Full downsampled trajectory of the current run. */
  chartPoints: SimPoint[]
  baselinePoints?: SimPoint[] | null
  baselineLabel?: string | null
  /** Config that produced the displayed run. */
  config: ReactorConfig | null
  playbackIndex: number
  fileBase: string
  tall?: boolean
}

const CONCENTRATION: SeriesDef[] = [
  { key: 'X', name: 'Biomass', color: '#f0b545', unit: 'g/L' },
  { key: 'S', name: 'Substrate', color: '#46e0c8', unit: 'g/L' },
  { key: 'P', name: 'Product', color: '#f0805f', unit: 'g/L' },
]
const RATE: SeriesDef[] = [{ key: 'mu', name: 'Growth rate μ', color: '#9fd18a', unit: 'h⁻¹' }]
const VOLUME: SeriesDef[] = [{ key: 'V', name: 'Volume', color: '#8fa6e8', unit: 'L' }]

const KEYS = ['X', 'S', 'P', 'V', 'mu'] as const

/** Merges the run and an optional baseline (interpolated onto the run's time grid). */
function buildRows(points: SimPoint[], baseline?: SimPoint[] | null): ChartRow[] {
  let j = 0
  return points.map((p) => {
    const row: ChartRow = { t: p.t, X: p.X, S: p.S, P: p.P, V: p.V, mu: p.mu }
    if (baseline && baseline.length > 1 && p.t <= baseline[baseline.length - 1].t + 1e-9) {
      while (j < baseline.length - 2 && baseline[j + 1].t < p.t) j++
      const a = baseline[j]
      const b = baseline[j + 1]
      const k = b.t > a.t ? Math.min(Math.max((p.t - a.t) / (b.t - a.t), 0), 1) : 0
      for (const key of KEYS) row[`b_${key}`] = a[key] + (b[key] - a[key]) * k
    }
    return row
  })
}

function useToggle(initial: string[]) {
  const [visible, setVisible] = useState<Set<string>>(new Set(initial))
  const toggle = (key: string) =>
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else next.add(key)
      return next
    })
  return [visible, toggle] as const
}

function ChartPanel({ chartPoints, baselinePoints, baselineLabel, config, playbackIndex, fileBase, tall = false }: ChartPanelProps) {
  const [visConc, toggleConc] = useToggle(['X', 'S', 'P'])
  const [visRate, toggleRate] = useToggle(['mu'])
  const [visVol, toggleVol] = useToggle(['V'])

  const rows = useMemo(() => buildRows(chartPoints, baselinePoints), [chartPoints, baselinePoints])
  const duration = chartPoints.length ? chartPoints[chartPoints.length - 1].t : (config?.settings.duration ?? 1)
  const count = playbackIndex + 1
  const height = tall ? 320 : 250

  const concRefs = useMemo<RefLineDef[] | undefined>(() => {
    if (!config || config.reactorType !== 'cstr') return undefined
    const ss = cstrSteadyState(config.cstr.D, config.cstr.Sf, config.kinetics)
    if (!ss) return undefined
    return [
      { y: ss.X, label: `X* = ${ss.X.toFixed(2)}`, color: '#f0b545' },
      { y: ss.P, label: `P* = ${ss.P.toFixed(2)}`, color: '#f0805f' },
    ]
  }, [config])

  const rateRefs = useMemo<RefLineDef[] | undefined>(() => {
    if (!config) return undefined
    const refs: RefLineDef[] = [{ y: config.kinetics.muMax, label: 'μmax', color: '#9fd18a' }]
    if (config.reactorType === 'cstr') refs.push({ y: config.cstr.D + config.kinetics.kd, label: 'D + kd', color: '#8fa6e8' })
    return refs
  }, [config])

  if (chartPoints.length === 0) {
    return (
      <div className="glass flex min-h-[220px] items-center justify-center p-8 text-center text-sm text-muted" role="status">
        The charts appear here once you run the experiment. They share one timeline with the reactor and the metric cards.
      </div>
    )
  }

  const common = { rows, count, duration, baselineLabel, height, fileBase }
  return (
    <div className={`grid grid-cols-1 gap-4 ${tall ? 'xl:grid-cols-2' : '2xl:grid-cols-2'}`}>
      <SeriesChart {...common} title="Concentrations" yLabel="g/L" series={CONCENTRATION} visibleKeys={visConc} onToggle={toggleConc} refLines={concRefs} />
      <SeriesChart {...common} title="Specific growth rate" yLabel="h⁻¹" series={RATE} visibleKeys={visRate} onToggle={toggleRate} refLines={rateRefs} />
      {config?.reactorType === 'fedbatch' && (
        <SeriesChart {...common} title="Reactor volume" yLabel="L" series={VOLUME} visibleKeys={visVol} onToggle={toggleVol} />
      )}
    </div>
  )
}

export default memo(ChartPanel)
