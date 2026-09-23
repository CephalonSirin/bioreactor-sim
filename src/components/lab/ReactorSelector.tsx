import ReactorGlyph from '../viz/ReactorGlyph'
import type { ReactorType } from '../../simulation/types'

interface ReactorSelectorProps {
  value: ReactorType
  onChange: (type: ReactorType) => void
  compact?: boolean
}

const OPTIONS: { type: ReactorType; name: string; tagline: string; detail: string }[] = [
  { type: 'batch', name: 'Batch', tagline: 'Closed system', detail: 'Everything loaded at the start. Nothing added or removed until the end.' },
  { type: 'fedbatch', name: 'Fed-batch', tagline: 'Feed in, nothing out', detail: 'Fresh substrate is pumped in, so the volume rises and depletion is delayed.' },
  { type: 'cstr', name: 'CSTR', tagline: 'Feed in, culture out', detail: 'Continuous stirred-tank: inflow equals outflow, volume constant. Steady state or washout.' },
]

export default function ReactorSelector({ value, onChange, compact = false }: ReactorSelectorProps) {
  return (
    <div role="group" aria-label="Reactor mode" className="grid grid-cols-3 gap-2 sm:gap-3">
      {OPTIONS.map((o) => {
        const active = o.type === value
        return (
          <button
            key={o.type}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.type)}
            className={`group relative overflow-hidden rounded-lg border p-2.5 text-left transition duration-300 sm:p-3.5 ${
              active
                ? 'border-aqua bg-aqua/10 shadow-glow'
                : 'border-ink-600 bg-ink-800/50 hover:border-aqua/60 hover:bg-ink-700/60'
            }`}
          >
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
              <ReactorGlyph type={o.type} className={`${compact ? 'h-10 w-12' : 'h-12 w-14 sm:h-16 sm:w-20'} shrink-0`} />
              <div className="min-w-0">
                <div className={`font-display text-sm font-semibold sm:text-base ${active ? 'text-aqua' : 'text-paper'}`}>{o.name}</div>
                <div className="hidden truncate font-mono text-[10px] uppercase tracking-wider text-muted sm:block sm:text-[11px]">{o.tagline}</div>
              </div>
            </div>
            {!compact && <p className="mt-2 hidden text-xs leading-snug text-muted lg:block">{o.detail}</p>}
          </button>
        )
      })}
    </div>
  )
}
