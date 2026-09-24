import { memo, useState } from 'react'
import { Check, ChevronDown, Clock } from 'lucide-react'
import Popover from '../ui/Popover'

const LENGTHS = [
  { h: 12, note: 'Early exponential phase' },
  { h: 24, note: 'One day' },
  { h: 40, note: 'Typical batch' },
  { h: 48, note: 'Two days' },
  { h: 72, note: 'Three days' },
  { h: 100, note: 'Long fed-batch' },
  { h: 150, note: 'Continuous, near steady state' },
  { h: 200, note: 'Maximum' },
]

interface DurationMenuProps {
  /** Run length currently configured, in hours. */
  value: number
  /** The loaded experiment's own run length. */
  reference: number
  onChange: (hours: number) => void
}

/**
 * Picks the simulated run length. Choosing a length re-integrates the model
 * straight away; a custom length (1 to 200 h) can be typed.
 */
function DurationMenu({ value, reference, onChange }: DurationMenuProps) {
  const [custom, setCustom] = useState('')
  const commitCustom = (close: () => void) => {
    const n = Math.round(Number(custom))
    if (!Number.isFinite(n) || n < 1 || n > 200) return
    onChange(n)
    setCustom('')
    close()
  }
  const valid = (() => {
    const n = Number(custom)
    return custom.trim() !== '' && Number.isFinite(n) && n >= 1 && n <= 200
  })()

  return (
    <Popover
      origin="bottom-left"
      role="menu"
      label="Run length"
      panelClassName="w-[260px]"
      trigger={(t) => (
        <button type="button" {...t} className="btn-secondary group !gap-1.5 !px-2.5" title="Simulated run length">
          <Clock className="!h-3.5 !w-3.5 text-ink-3" aria-hidden="true" />
          <span className="num font-mono">{value} h</span>
          <ChevronDown className="!h-3.5 !w-3.5 text-ink-3 transition-transform duration-200 group-aria-expanded:rotate-180" aria-hidden="true" />
        </button>
      )}
    >
      {(close) => (
        <div className="menu">
          <p className="px-2.5 pb-1 pt-1.5 text-micro font-medium text-ink-3">Run length</p>
          {LENGTHS.map((l, i) => {
            const active = l.h === value
            return (
              <button
                key={l.h}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  close()
                  if (!active) onChange(l.h)
                }}
                className="menu-item stagger-in !py-1.5"
                style={{ ['--i' as string]: i }}
              >
                <Check className={active ? '!text-ink' : '!text-transparent'} aria-hidden="true" />
                <span className="num w-12 font-mono text-ink">{l.h} h</span>
                <span className="flex-1 truncate text-label text-ink-3">{l.h === reference ? 'This experiment' : l.note}</span>
              </button>
            )
          })}
          <form
            className="mt-1 flex items-center gap-2 border-t border-line px-2.5 pb-1.5 pt-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              commitCustom(close)
            }}
          >
            <label htmlFor="custom-length" className="text-label text-ink-2">
              Custom
            </label>
            <input
              id="custom-length"
              type="text"
              inputMode="numeric"
              placeholder={String(value)}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={custom !== '' && !valid}
              className="field !w-16 flex-none"
            />
            <span className="font-mono text-micro text-ink-3">h</span>
            <button type="submit" disabled={!valid} className="btn-primary btn-sm ml-auto">
              Run
            </button>
          </form>
          <p className="px-2.5 pb-1 text-micro text-ink-4">1 to 200 h. The run restarts with the new length.</p>
        </div>
      )}
    </Popover>
  )
}

export default memo(DurationMenu)
