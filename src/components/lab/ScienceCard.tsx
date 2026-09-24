import { memo } from 'react'
import { EquationBlock } from '../ui/Eq'
import { renderMath } from '../ui/mathText'
import { MASS_BALANCES, RATE_LAWS } from '../../content/equations'
import { hrefFor } from '../../hooks/useHashRoute'
import { PRESETS } from '../../simulation/presets'
import type { ReactorType } from '../../simulation/types'

interface ScienceCardProps {
  reactorType: ReactorType
  label: string
  modified: boolean
}

/** Explains the loaded experiment and shows the equations the run is using. */
function ScienceCard({ reactorType, label, modified }: ScienceCardProps) {
  const preset = PRESETS.find((p) => p.label === label && p.reactorType === reactorType)
  const set = MASS_BALANCES[reactorType]
  return (
    <section className="glass p-5" aria-label="Scientific explanation">
      <h3 className="mb-3 font-display text-sm font-semibold text-paper">The science behind this run</h3>
      {preset && !modified && (
        <div className="mb-4 space-y-2 text-[13px] leading-relaxed">
          <p className="text-paper/90">{preset.science}</p>
          <p className="text-muted">
            <span className="font-mono text-[11px] uppercase tracking-wider text-aqua">Watch for </span>
            {preset.watchFor}
          </p>
        </div>
      )}
      <details className="group" open>
        <summary className="flex cursor-pointer items-center justify-between py-1 text-[13px] font-medium text-paper">
          <span>
            {set.title}: mass balances <span className="text-muted">({set.summary})</span>
          </span>
          <span className="text-muted transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
        </summary>
        <EquationBlock lines={[RATE_LAWS.monod, RATE_LAWS.product, RATE_LAWS.uptake]} accent="#9fd18a" label="Rate laws" />
        <EquationBlock lines={set.lines} label={`${set.title} mass balances`} />
        <ul className="mb-1 mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
          {set.meaning.map((m, i) => (
            <li key={i}>
              {renderMath(m)}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-3 text-xs text-dim">
        Educational, simplified, deterministic model with a single limiting substrate.{' '}
        <a className="text-aqua hover:underline" href={hrefFor('methodology')}>
          Full methodology and assumptions →
        </a>
      </p>
    </section>
  )
}

export default memo(ScienceCard)
