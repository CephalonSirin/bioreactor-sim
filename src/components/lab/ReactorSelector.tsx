import { memo } from 'react'
import ReactorGlyph from '../viz/ReactorGlyph'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'
import type { ReactorType } from '../../simulation/types'

interface ReactorSelectorProps {
  value: ReactorType
  onChange: (type: ReactorType) => void
}

const MODE_OPTIONS: { type: ReactorType; name: string; flow: string; detail: string }[] = [
  { type: 'batch', name: 'Batch', flow: 'No flow', detail: 'Closed vessel. Everything is loaded at t = 0 and nothing enters or leaves.' },
  { type: 'fedbatch', name: 'Fed-batch', flow: 'Feed in, V rises', detail: 'Feed is pumped in at rate F and nothing leaves, so the volume rises.' },
  { type: 'cstr', name: 'CSTR', flow: 'In = out, V fixed', detail: 'Continuous stirred tank: feed in and culture out at the same rate D·V.' },
]

/**
 * Reactor configuration switch. Each option carries its process schematic
 * and what crosses the vessel boundary, so the choice reads as picking a
 * piece of equipment rather than a tab.
 */
function ReactorSelector({ value, onChange }: ReactorSelectorProps) {
  const { box, pill } = useSlidingIndicator<HTMLDivElement>(value)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const i = MODE_OPTIONS.findIndex((o) => o.type === value)
    const next = MODE_OPTIONS[(i + dir + MODE_OPTIONS.length) % MODE_OPTIONS.length]
    onChange(next.type)
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>('[data-active="true"]')?.focus())
  }
  return (
    <div ref={box} role="radiogroup" aria-label="Reactor configuration" className="seg w-full sm:w-auto" onKeyDown={onKeyDown}>
      <span ref={pill} className="seg-pill !h-[46px]" aria-hidden="true" />
      {MODE_OPTIONS.map((o) => {
        const active = o.type === value
        return (
          <button
            key={o.type}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active}
            tabIndex={active ? 0 : -1}
            title={o.detail}
            onClick={() => onChange(o.type)}
            className={`seg-item !h-[46px] flex-1 gap-2.5 sm:flex-none sm:!justify-start sm:!pl-2 sm:!pr-3.5 ${active ? '!text-ink' : ''}`}
          >
            <ReactorGlyph type={o.type} className={`hidden h-8 w-10 shrink-0 transition-colors duration-200 sm:block ${active ? 'text-ink' : 'text-ink-4'}`} />
            <span className="flex min-w-0 flex-col items-center leading-tight sm:items-start">
              <span className="text-ui font-semibold">{o.name}</span>
              <span className="hidden whitespace-nowrap text-micro font-normal text-ink-3 sm:block">{o.flow}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default memo(ReactorSelector)
