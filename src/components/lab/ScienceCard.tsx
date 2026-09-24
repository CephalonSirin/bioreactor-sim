import { memo } from 'react'
import { ArrowRight } from 'lucide-react'
import { Eq } from '../ui/Eq'
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

/** The loaded experiment's rationale, and the equations the run integrates. */
function ScienceCard({ reactorType, label, modified }: ScienceCardProps) {
  const preset = PRESETS.find((p) => p.label === label && p.reactorType === reactorType)
  const set = MASS_BALANCES[reactorType]
  const rate = [RATE_LAWS.monod, RATE_LAWS.product, RATE_LAWS.uptake]
  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <h3 className="t-sub mb-3">{preset && !modified ? preset.label : 'This configuration'}</h3>
        {preset && !modified ? (
          <div className="space-y-4 text-body leading-relaxed text-ink-2">
            <p>{preset.science}</p>
            <div className="border-l border-line-strong pl-4">
              <p className="t-label mb-1">What to look for</p>
              <p>{preset.watchFor}</p>
            </div>
          </div>
        ) : (
          <p className="text-body leading-relaxed text-ink-2">{set.summary}</p>
        )}
        <a className="link mt-5 inline-flex items-center gap-1 text-ui" href={hrefFor('methodology')}>
          Assumptions and full methodology <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div>
        <h3 className="t-sub mb-3">Equations integrated · {set.title.replace(/ reactor.*$/, '')}</h3>
        <div className="rounded-lg border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <p className="t-label mb-2">Rate laws</p>
            {rate.map((l, i) => (
              <div key={l} className="flex items-baseline justify-between gap-4">
                <Eq block className="!text-[1.12rem]">{l}</Eq>
                <span className="font-mono text-micro text-ink-4">({i + 1})</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4">
            <p className="t-label mb-2">Mass balances</p>
            {set.lines.map((l, i) => (
              <div key={l} className="flex items-baseline justify-between gap-4">
                <Eq block className="!text-[1.12rem]">{l}</Eq>
                <span className="font-mono text-micro text-ink-4">({i + 4})</span>
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-label leading-relaxed text-ink-3">
          {set.meaning.map((m, i) => (
            <li key={i}>{renderMath(m)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default memo(ScienceCard)
