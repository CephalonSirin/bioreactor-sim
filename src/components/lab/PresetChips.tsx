import { memo } from 'react'
import { PRESETS, PRESETS_BY_REACTOR } from '../../simulation/presets'
import type { Preset } from '../../simulation/presets'
import type { ReactorType } from '../../simulation/types'
import { hrefFor } from '../../hooks/useHashRoute'

interface PresetChipsProps {
  reactorType: ReactorType
  /** Label of the loaded experiment (to highlight the active preset). */
  activeLabel: string
  modified: boolean
  onSelect: (preset: Preset) => void
  /** Show presets for every reactor mode (presentation mode). */
  all?: boolean
  title?: string
}

function PresetChips({ reactorType, activeLabel, modified, onSelect, all = false, title = 'Experiments' }: PresetChipsProps) {
  const list = all ? PRESETS : PRESETS_BY_REACTOR(reactorType)
  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-semibold text-paper">{title}</h2>
        <a href={hrefFor('experiments')} className="font-mono text-[11px] text-aqua hover:underline">
          Gallery →
        </a>
      </div>
      <div className="flex flex-col gap-1.5">
        {list.map((p) => {
          const active = !modified && p.label === activeLabel
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              aria-pressed={active}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                active ? 'border-aqua bg-aqua/10' : 'border-ink-600 bg-ink-900/40 hover:border-aqua/60'
              }`}
            >
              <span className={`block text-[13px] font-medium ${active ? 'text-aqua' : 'text-paper'}`}>{p.label}</span>
              <span className="block text-[11px] leading-snug text-muted">{p.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(PresetChips)
