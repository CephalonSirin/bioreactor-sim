import { useId } from 'react'
import { FONT, INK } from '../../lib/palette'

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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel} fontFamily={FONT.mono}>
      <defs>
        <clipPath id={`c-${uid}`}>
          <rect x={PAD.l} y={PAD.t} width={iw} height={ih} />
        </clipPath>
      </defs>
      {regions?.map((r) => (
        <g key={r.label}>
          <rect x={sx(r.x0)} y={PAD.t} width={Math.max(sx(r.x1) - sx(r.x0), 0)} height={ih} fill={r.color} opacity="0.07" />
          <text x={(sx(r.x0) + sx(r.x1)) / 2} y={PAD.t + 12} textAnchor="middle" fontSize="9.5" fill={INK[2]}>
            {r.label}
          </text>
        </g>
      ))}
      {ticks(yMax).map((v) => (
        <g key={`y${v}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="#ECECE8" />
          <text x={PAD.l - 6} y={sy(v) + 3} textAnchor="end" fontSize="10" fill={INK[3]}>
            {fmt(v)}
          </text>
        </g>
      ))}
      {ticks(xMax).map((v) => (
        <text key={`x${v}`} x={sx(v)} y={PAD.t + ih + 14} textAnchor="middle" fontSize="10" fill={INK[3]}>
          {fmt(v)}
        </text>
      ))}
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PAD.t + ih} stroke={INK.lineStrong} />
      <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih} y2={PAD.t + ih} stroke={INK.lineStrong} />
      <text x={PAD.l + iw / 2} y={PAD.t + ih + 29} textAnchor="middle" fontSize="10.5" fill={INK[3]}>
        {xLabel}
      </text>
      <text transform={`translate(11 ${PAD.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize="10.5" fill={INK[3]}>
        {yLabel}
      </text>
      <g clipPath={`url(#c-${uid})`}>
        {hLines?.map((l) => (
          <g key={l.label}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(l.y)} y2={sy(l.y)} stroke={l.color} strokeDasharray="5 4" opacity="0.7" />
            <text x={W - PAD.r - 4} y={sy(l.y) - 4} textAnchor="end" fontSize="9.5" fill={INK[2]}>
              {l.label}
            </text>
          </g>
        ))}
        {vLines?.map((l) => (
          <g key={l.label}>
            <line x1={sx(l.x)} x2={sx(l.x)} y1={PAD.t} y2={PAD.t + ih} stroke={l.color} strokeDasharray="5 4" opacity="0.8" />
            <text x={sx(l.x) - 4} y={PAD.t + ih - 6} textAnchor="end" fontSize="9.5" fill={INK[2]}>
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
            strokeWidth="2"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
          />
        ))}
      </g>
      {markers?.map((m, i) => (
        <g key={i}>
          <circle cx={sx(m.x)} cy={sy(m.y)} r="5" fill={m.color} stroke="#fff" strokeWidth="2" style={{ transition: 'cx 120ms ease-out, cy 120ms ease-out' }} />
          {m.label && (
            <text x={Math.min(sx(m.x) + 9, W - 60)} y={sy(m.y) - 8} fontSize="10" fill={INK[1]}>
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
                <text x="18" fill={INK[3]}>
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
  color = INK[1],
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
      <div className="mb-0.5 flex items-baseline justify-between gap-3 text-ui">
        <label htmlFor={id} className="text-ink-2">
          {label}
        </label>
        <span className="num font-mono text-ink">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} <span className="text-micro text-ink-3">{unit}</span>
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
        style={{ ['--pct' as string]: `${pct}%`, ['--fill' as string]: color }}
      />
    </div>
  )
}
