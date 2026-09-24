import { memo } from 'react'
import AnimatedNumber from '../ui/AnimatedNumber'
import { renderMath } from '../ui/mathText'
import { specificGrowthRate } from '../../simulation/kinetics'
import { dilutionRateAt } from '../../simulation/metrics'
import { SERIES } from '../../lib/palette'
import type { ReactorConfig, RunningMetrics, SimPoint } from '../../simulation/types'

interface MetricCardsProps {
  point: SimPoint | null
  config: ReactorConfig
  running: RunningMetrics | null
  index: number
  /** Larger type for projectors (classroom mode). */
  large?: boolean
}

interface Row {
  key: string
  name: string
  symbol: string
  unit: string
  color?: string
  value: number
  digits: number
  note?: string
}

/**
 * Live measurements at the playback time, set as an instrument readout:
 * name and symbol on the left, the value in tabular figures on the right,
 * with each state variable keyed to its chart line.
 */
function MetricCards({ point, config, running, index, large = false }: MetricCardsProps) {
  const preview: SimPoint = {
    t: 0,
    X: config.initial.X0,
    S: config.initial.S0,
    P: config.initial.P0,
    V: config.initial.V0,
    mu: specificGrowthRate(config.initial.S0, config.kinetics),
  }
  const p = point ?? preview
  const idx = Math.min(index, (running?.productivity.length ?? 1) - 1)
  const flowing = config.reactorType !== 'batch'

  const state: Row[] = [
    { key: 'X', name: 'Biomass', symbol: 'X', unit: 'g/L', color: SERIES.X, value: p.X, digits: 3 },
    { key: 'S', name: 'Substrate', symbol: 'S', unit: 'g/L', color: SERIES.S, value: p.S, digits: 3 },
    { key: 'P', name: 'Product', symbol: 'P', unit: 'g/L', color: SERIES.P, value: p.P, digits: 3 },
    { key: 'mu', name: 'Growth rate', symbol: 'μ', unit: 'h⁻¹', color: SERIES.mu, value: p.mu, digits: 3 },
    { key: 'V', name: 'Volume', symbol: 'V', unit: 'L', color: SERIES.V, value: p.V, digits: 3 },
  ]
  const derived: Row[] = [
    {
      key: 'D',
      name: 'Dilution rate',
      symbol: 'D',
      unit: 'h⁻¹',
      value: running ? running.dilution[idx] : dilutionRateAt(config, p),
      digits: 3,
      note: flowing ? undefined : 'no flow',
    },
    { key: 'Q', name: 'Productivity', symbol: 'Q_{P}', unit: 'g/h', value: running ? running.productivity[idx] : 0, digits: 3 },
    { key: 'Y', name: 'Realised yield', symbol: 'Y_{x/s}', unit: 'g/g', value: running ? running.yield[idx] : 0, digits: 3 },
  ]

  const muFrac = config.kinetics.muMax > 0 ? Math.min(Math.max(p.mu / config.kinetics.muMax, 0), 1) : 0

  return (
    <div className="flex flex-col">
      <dl>
        {state.map((r) => (
          <div key={r.key} className={`grid grid-cols-[1fr_auto] items-baseline gap-x-3 border-b border-line ${large ? 'py-3' : 'py-2'}`}>
            <dt className={`flex items-baseline gap-2 ${large ? 'text-base' : 'text-ui'} text-ink-2`}>
              <span className="swatch translate-y-[-3px]" style={{ color: r.color }} aria-hidden="true" />
              {r.name}
              <span className="math text-[14px] text-ink-3">{renderMath(r.symbol)}</span>
            </dt>
            <dd className="num flex items-baseline justify-end gap-1.5 font-mono">
              <AnimatedNumber value={r.value} digits={r.digits} duration={180} className={`${large ? 'text-3xl' : 'text-[19px]'} font-medium tracking-[-0.02em] text-ink`} />
              <span className="w-8 text-micro text-ink-3">{r.unit}</span>
            </dd>
            {r.key === 'mu' && (
              <div className="col-span-2 mt-1.5 flex items-center gap-2" aria-hidden="true">
                <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full origin-left rounded-full bg-ink-2 transition-transform duration-150 ease-out" style={{ transform: `scaleX(${muFrac})` }} />
                </div>
                <span className="num w-[5.5rem] text-right font-mono text-micro text-ink-3">{(muFrac * 100).toFixed(0)}% of μmax</span>
              </div>
            )}
          </div>
        ))}
      </dl>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {derived.map((r) => (
          <div key={r.key} className="min-w-0">
            <dt className="flex items-baseline gap-1 truncate text-micro text-ink-3">
              {r.name}
            </dt>
            <dd className="num mt-0.5 font-mono text-ui text-ink">
              {r.note ? <span className="text-ink-3">{r.note}</span> : <AnimatedNumber value={r.value} digits={r.digits} duration={180} />}
              {!r.note && <span className="ml-1 text-micro text-ink-3">{r.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default memo(MetricCards)
