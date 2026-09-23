import { useId } from 'react'

export interface LineSeries {
  points: [number, number][]
  color: string
  dashed?: boolean
  label?: string
}

export interface Marker {
  x: number
  y: number
  color: string
  label?: string
}

export interface Region {
  x0: number
  x1: number
  color: string
  label: string
}

interface LineSvgProps {
  series: LineSeries[]
  xMax: number
  yMax: number
  xLabel: string
  yLabel: string
  vLines?: { x: number; label: string; color: string }[]
  hLines?: { y: number; label: string; color: string }[]
  markers?: Marker[]
  regions?: Region[]
  ariaLabel: string
  height?: number
}

const W = 520
const PAD = { l: 46, r: 12, t: 12, b: 36 }
const LEGEND_ROOM = 20

/** Small dependency-free line chart used by the interactive explainers. */
export default function LineSvg({ series, xMax, yMax, xLabel, yLabel, vLines, hLines, markers, regions, ariaLabel, height = 230 }: LineSvgProps) {
  const uid = useId().replace(/:/g, '')
  const hasLegend = series.some((s) => s.label)
  const padB = PAD.b + (hasLegend ? LEGEND_ROOM : 0)
  const H = height + (hasLegend ? LEGEND_ROOM : 0)
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - padB
  const sx = (x: number) => PAD.l + (Math.min(Math.max(x, 0), xMax) / xMax) * iw
  const sy = (y: number) => PAD.t + ih - (Math.min(Math.max(y, 0), yMax) / yMax) * ih
  const ticks = (max: number) => [0, 1, 2, 3, 4].map((i) => (max * i) / 4)
  const fmt = (v: number) => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel} fontFamily="IBM Plex Mono, monospace">
      <defs>
        <clipPath id={`c-${uid}`}>
          <rect x={PAD.l} y={PAD.t} width={iw} height={ih} />
        </clipPath>
      </defs>
      {regions?.map((r) => (
        <g key={r.label}>
          <rect x={sx(r.x0)} y={PAD.t} width={Math.max(sx(r.x1) - sx(r.x0), 0)} height={ih} fill={r.color} opacity="0.11" />
          <text x={(sx(r.x0) + sx(r.x1)) / 2} y={PAD.t + 12} textAnchor="middle" fontSize="9.5" fill={r.color}>
            {r.label}
          </text>
        </g>
      ))}
      {ticks(yMax).map((v) => (
        <g key={`y${v}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="rgba(120,200,192,0.12)" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={sy(v) + 3} textAnchor="end" fontSize="10" fill="#8ea3a3">
            {fmt(v)}
          </text>
        </g>
      ))}
      {ticks(xMax).map((v) => (
        <text key={`x${v}`} x={sx(v)} y={PAD.t + ih + 14} textAnchor="middle" fontSize="10" fill="#8ea3a3">
          {fmt(v)}
        </text>
      ))}
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PAD.t + ih} stroke="#34525a" />
      <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih} y2={PAD.t + ih} stroke="#34525a" />
      <text x={PAD.l + iw / 2} y={PAD.t + ih + 29} textAnchor="middle" fontSize="10.5" fill="#8ea3a3">
        {xLabel}
      </text>
      <text transform={`translate(11 ${PAD.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="10.5" fill="#8ea3a3">
        {yLabel}
      </text>
      <g clipPath={`url(#c-${uid})`}>
        {hLines?.map((l) => (
          <g key={l.label}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(l.y)} y2={sy(l.y)} stroke={l.color} strokeDasharray="5 4" opacity="0.7" />
            <text x={W - PAD.r - 4} y={sy(l.y) - 4} textAnchor="end" fontSize="9.5" fill={l.color}>
              {l.label}
            </text>
          </g>
        ))}
        {vLines?.map((l) => (
          <g key={l.label}>
            <line x1={sx(l.x)} x2={sx(l.x)} y1={PAD.t} y2={PAD.t + ih} stroke={l.color} strokeDasharray="5 4" opacity="0.8" />
            <text x={sx(l.x) - 4} y={PAD.t + ih - 6} textAnchor="end" fontSize="9.5" fill={l.color}>
              {l.label}
            </text>
          </g>
        ))}
        {series.map((s, i) => (
          <path
            key={i}
            d={s.points.map(([x, y], k) => `${k === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="2.2"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
          />
        ))}
      </g>
      {markers?.map((m, i) => (
        <g key={i}>
          <circle cx={sx(m.x)} cy={sy(m.y)} r="5" fill={m.color} stroke="#050c0e" strokeWidth="1.5" />
          {m.label && (
            <text x={Math.min(sx(m.x) + 9, W - 60)} y={sy(m.y) - 8} fontSize="10" fill={m.color}>
              {m.label}
            </text>
          )}
        </g>
      ))}
      {series.some((s) => s.label) && (
        <g fontSize="10">
          {series
            .filter((s) => s.label)
            .map((s, i) => (
              <g key={i} transform={`translate(${PAD.l + 10 + i * 130} ${PAD.t + ih + 46})`}>
                <line x1="0" x2="14" y1="-3" y2="-3" stroke={s.color} strokeWidth="2.2" strokeDasharray={s.dashed ? '4 3' : undefined} />
                <text x="18" fill="#8ea3a3">
                  {s.label}
                </text>
              </g>
            ))}
        </g>
      )}
    </svg>
  )
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color = '#46e0c8',
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  color?: string
}) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <label htmlFor={id} className="text-paper/90">
          {label}
        </label>
        <span className="font-mono text-paper">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} <span className="text-muted">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--slider-fill' as string]: color, ['--slider-pct' as string]: `${pct}%` }}
      />
    </div>
  )
}
