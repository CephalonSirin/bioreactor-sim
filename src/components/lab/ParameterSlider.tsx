import { useEffect, useId, useState } from 'react'
import InfoTooltip from '../ui/InfoTooltip'

interface ParameterSliderProps {
  label: string
  symbol?: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  accent?: string
  tooltip?: React.ReactNode
  disabled?: boolean
}

const decimalsOf = (step: number) => (step.toString().split('.')[1] ?? '').length

export default function ParameterSlider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  accent = '#34525a',
  tooltip,
  disabled,
}: ParameterSliderProps) {
  const id = useId()
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  const digits = decimalsOf(step)
  const safe = Number.isFinite(value) ? value : min

  // The number box keeps a draft so multi-digit values can be typed
  // freely; it commits (clamped to the allowed range) as soon as the text
  // is a valid number, and reverts on blur if it isn't.
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

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex min-w-0 flex-wrap items-baseline text-xs font-medium leading-tight text-paper/90">
          <span>{label}</span>
          {symbol && <span className="ml-1 shrink-0 font-mono text-muted">({symbol})</span>}
        </label>
        {tooltip && <InfoTooltip label={`About ${label}`}>{tooltip}</InfoTooltip>}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`${label} value`}
            aria-invalid={invalid}
            value={draft}
            disabled={disabled}
            onChange={(e) => commit(e.target.value)}
            onBlur={() => {
              setDraft(safe.toFixed(digits))
              setInvalid(false)
            }}
            className={`w-[4.5rem] rounded border bg-ink-950/70 px-1.5 py-0.5 text-right font-mono text-xs text-paper focus-visible:border-aqua disabled:opacity-40 ${
              invalid ? 'border-readout-product' : 'border-ink-500'
            }`}
          />
          <span className="w-9 font-mono text-[10px] text-muted">{unit}</span>
        </div>
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
        style={{ ['--slider-fill' as string]: accent, ['--slider-pct' as string]: `${Math.min(Math.max(pct, 0), 100)}%` }}
        className="disabled:opacity-40"
      />
      {invalid && (
        <p className="mt-1 text-[11px] text-readout-product" role="alert">
          Allowed range: {min} to {max}. The nearest allowed value is used.
        </p>
      )}
    </div>
  )
}
