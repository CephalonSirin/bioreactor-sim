import type { ReactNode } from 'react'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  title?: string
}

interface SegmentedProps<T extends string | number> {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  itemClassName?: string
}

/** Segmented control with a sliding selection (transitions.dev tabs pattern). */
export default function Segmented<T extends string | number>({ value, options, onChange, label, className = '', itemClassName = '' }: SegmentedProps<T>) {
  const { box, pill } = useSlidingIndicator<HTMLDivElement>(value)
  return (
    <div ref={box} role="group" aria-label={label} className={`seg ${className}`}>
      <span ref={pill} className="seg-pill" aria-hidden="true" />
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            data-active={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`seg-item ${itemClassName}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
