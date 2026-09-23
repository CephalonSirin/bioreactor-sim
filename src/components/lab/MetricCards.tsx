import { memo } from 'react'
import AnimatedNumber from '../ui/AnimatedNumber'
import { specificGrowthRate } from '../../simulation/kinetics'
import { dilutionRateAt } from '../../simulation/metrics'
import type { ReactorConfig, RunningMetrics, SimPoint } from '../../simulation/types'

interface MetricCardsProps {
  point: SimPoint | null
  config: ReactorConfig
  running: RunningMetrics | null
  index: number
  /** Larger type for projectors (presentation mode). */
  large?: boolean
}

interface CardDef {
  key: string
  label: string
  symbol: string
  unit: string
  color: string
  value: number
  digits: number
  bar?: number
  hint: string
}

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
  const cards: CardDef[] = [
    { key: 'X', label: 'Biomass', symbol: 'X', unit: 'g/L', color: '#f0b545', value: p.X, digits: 2, hint: 'cell concentration' },
    { key: 'S', label: 'Substrate', symbol: 'S', unit: 'g/L', color: '#46e0c8', value: p.S, digits: 2, hint: 'limiting nutrient' },
    { key: 'P', label: 'Product', symbol: 'P', unit: 'g/L', color: '#f0805f', value: p.P, digits: 2, hint: 'target compound' },
    {
      key: 'mu',
      label: 'Growth rate',
      symbol: 'μ',
      unit: 'h⁻¹',
      color: '#9fd18a',
      value: p.mu,
      digits: 3,
      bar: config.kinetics.muMax > 0 ? p.mu / config.kinetics.muMax : 0,
      hint: 'fraction of μmax',
    },
    { key: 'V', label: 'Volume', symbol: 'V', unit: 'L', color: '#8fa6e8', value: p.V, digits: 2, hint: 'working volume' },
    {
      key: 'D',
      label: 'Dilution rate',
      symbol: 'D',
      unit: 'h⁻¹',
      color: '#8fa6e8',
      value: running ? running.dilution[idx] : dilutionRateAt(config, p),
      digits: 3,
      hint: config.reactorType === 'batch' ? 'no flow in batch' : 'F / V',
    },
    { key: 'prod', label: 'Productivity', symbol: 'Q', unit: 'g/h', color: '#f0805f', value: running ? running.productivity[idx] : 0, digits: 3, hint: 'product formed per hour' },
    { key: 'yield', label: 'Yield', symbol: 'Yx/s', unit: 'g/g', color: '#f0b545', value: running ? running.yield[idx] : 0, digits: 3, hint: 'biomass per substrate used' },
  ]

  return (
    <div className={`grid gap-2 ${large ? 'grid-cols-2 sm:gap-3' : 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4'}`}>
      {cards.map((c) => (
        <div
          key={c.key}
          className="glass relative overflow-hidden px-3 py-2.5"
          style={{ borderLeft: `3px solid ${c.color}` }}
          role="group"
          aria-label={`${c.label} ${c.symbol}`}
        >
          <div className="flex items-baseline justify-between gap-1">
            <span className={`font-mono uppercase tracking-wider text-muted ${large ? 'text-xs' : 'text-[10px]'}`}>{c.label}</span>
            <span className="math text-xs text-dim">{c.symbol}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <AnimatedNumber
              value={c.value}
              digits={c.digits}
              className={`readout-value ${large ? 'text-4xl' : 'text-2xl'} font-medium`}
            />
            <span className={`font-mono text-muted ${large ? 'text-sm' : 'text-[11px]'}`}>{c.unit}</span>
          </div>
          {c.bar !== undefined ? (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-600" aria-hidden="true">
              <div
                className="h-full origin-left rounded-full transition-transform duration-200"
                style={{ background: c.color, transform: `scaleX(${Math.min(Math.max(c.bar, 0), 1)})` }}
              />
            </div>
          ) : (
            <div className={`mt-1 text-dim ${large ? 'text-xs' : 'text-[10px]'}`}>{c.hint}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default memo(MetricCards)
