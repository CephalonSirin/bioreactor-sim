import { memo, useEffect, useId, useState } from 'react'
import { renderMath } from '../ui/mathText'

interface ParameterSliderProps {
  label: string
  /** Math markup, e.g. `μ_{max}`. */
  symbol?: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  tooltip?: React.ReactNode
  disabled?: boolean
  /** Differs from the loaded experiment's value. */
  changed?: boolean
}

const decimalsOf = (step: number) => (step.toString().split('.')[1] ?? '').length

/**
 * One instrument setting: name and symbol, an exact numeric entry with
 * its unit, and a slider for coarse adjustment beneath. Typing commits as
 * soon as the text is a number (clamped to range); invalid text reverts
 * on blur.
 */
function ParameterSlider({ label, symbol, value, min, max, step, unit, onChange, tooltip, disabled, changed }: ParameterSliderProps) {
  const id = useId()
  const digits = decimalsOf(step)
  const safe = Number.isFinite(value) ? value : min
  const pct = max > min ? ((safe - min) / (max - min)) * 100 : 0

  const [draft, setDraft] = useState(safe.toFixed(digits))
  const [invalid, setInvalid] = useState(false)
  useEffect(() => {
    setDraft(safe.toFixed(digits))
    setInvalid(false)
  }, [safe, digits])

  const commit = (raw: string) => {
    setDraft(raw)
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(n)) {
      setInvalid(true)
      return
    }
    setInvalid(n < min || n > max)
    onChange(Math.min(max, Math.max(min, n)))
  }

  const nudge = (dir: 1 | -1, big: boolean) => {
    const next = Math.min(max, Math.max(min, safe + dir * step * (big ? 10 : 1)))
    onChange(Number(next.toFixed(digits)))
  }

  return (
    <div className="group/param py-2.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="flex min-w-0 flex-1 items-baseline gap-1.5 text-ui text-ink-2" title={typeof tooltip === 'string' ? tooltip : undefined}>
          <span className="truncate">{label}</span>
          {symbol && <span className="math shrink-0 text-[14px] text-ink-3">{renderMath(symbol)}</span>}
          {changed && <span className="h-1.5 w-1.5 shrink-0 self-center rounded-full bg-accent" title="Changed from the loaded experiment" />}
        </label>
        <input
          type="text"
          inputMode="decimal"
          aria-label={`${label}, ${unit}`}
          aria-invalid={invalid}
          aria-describedby={tooltip ? `${id}-d` : undefined}
          value={draft}
          disabled={disabled}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              nudge(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
            }
          }}
          onBlur={() => {
            setDraft(safe.toFixed(digits))
            setInvalid(false)
          }}
          className="field"
        />
        <span className="w-10 shrink-0 font-mono text-micro text-ink-3">{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={safe}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={tooltip ? `${id}-d` : undefined}
        style={{ ['--pct' as string]: `${Math.min(Math.max(pct, 0), 100)}%` }}
        className="mt-1.5 block"
      />
      {tooltip && (
        // The explanation opens while the setting is being adjusted.
        <div className="param-desc">
          <p id={`${id}-d`} className="overflow-hidden text-micro leading-snug text-ink-3">
            <span className="block pt-1.5">{tooltip}</span>
          </p>
        </div>
      )}
      {invalid && (
        <p className="mt-1 text-micro text-danger" role="alert">
          Allowed range {min} to {max} {unit}. The nearest allowed value is used.
        </p>
      )}
    </div>
  )
}

export default memo(ParameterSlider)
