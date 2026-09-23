import { memo, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadSvgAsPng } from '../../lib/exportImage'
import { niceAxis } from '../../lib/axis'

export interface SeriesDef {
  key: string
  name: string
  color: string
  unit: string
}

export interface ChartRow {
  t: number
  [key: string]: number | undefined
}

export interface RefLineDef {
  y: number
  label: string
  color: string
}

interface SeriesChartProps {
  title: string
  yLabel: string
  series: SeriesDef[]
  /** Complete run rows (used for stable axis limits). */
  rows: ChartRow[]
  /** How many rows have been revealed by playback. */
  count: number
  duration: number
  visibleKeys: Set<string>
  onToggle: (key: string) => void
  baselineLabel?: string | null
  refLines?: RefLineDef[]
  height?: number
  fileBase: string
}

const AXIS = { fontSize: 11, fill: '#8ea3a3', fontFamily: 'IBM Plex Mono, monospace' }

function SeriesChart({
  title,
  yLabel,
  series,
  rows,
  count,
  duration,
  visibleKeys,
  onToggle,
  baselineLabel,
  refLines,
  height = 250,
  fileBase,
}: SeriesChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const active = series.filter((s) => visibleKeys.has(s.key))

  const axis = useMemo(() => {
    let max = 0
    for (const r of rows) {
      for (const s of active) {
        const a = r[s.key]
        const b = r[`b_${s.key}`]
        if (a !== undefined && Number.isFinite(a)) max = Math.max(max, a)
        if (b !== undefined && Number.isFinite(b)) max = Math.max(max, b)
      }
    }
    for (const l of refLines ?? []) max = Math.max(max, l.y)
    return niceAxis(max * 1.04)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, visibleKeys, refLines])

  const data = useMemo(() => rows.slice(0, Math.max(count, 1)), [rows, count])
  const xTicks = useMemo(() => niceAxis(duration, 6).ticks.filter((t) => t <= duration + 1e-9), [duration])

  const handleDownload = async () => {
    const svg = box.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null
    if (!svg) return
    try {
      setExportError(null)
      await downloadSvgAsPng(svg, `${fileBase}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, {
        caption: `${title} — Bioreactor Lab (educational model)`,
      })
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Image export failed.')
    }
  }

  return (
    <figure className="glass p-4" aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-display text-sm font-semibold text-paper">{title}</figcaption>
        <div className="flex flex-wrap items-center gap-1.5">
          {series.map((s) => {
            const on = visibleKeys.has(s.key)
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(s.key)}
                className="flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] transition-colors"
                style={{
                  borderColor: on ? s.color : '#34525a',
                  color: on ? s.color : '#8ea3a3',
                  backgroundColor: on ? `${s.color}1a` : 'transparent',
                }}
              >
                <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: on ? s.color : '#34525a' }} />
                {s.name}
              </button>
            )
          })}
          <button type="button" onClick={handleDownload} className="rounded border border-ink-500 px-2 py-0.5 font-mono text-[11px] text-muted hover:border-aqua hover:text-aqua" title="Download this chart as a PNG image">
            PNG
          </button>
        </div>
      </div>
      <div ref={box}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 6, right: 14, left: 0, bottom: 14 }}>
            <CartesianGrid stroke="rgba(120,200,192,0.10)" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="t"
              domain={[0, duration]}
              ticks={xTicks}
              stroke="#34525a"
              tick={AXIS}
              tickFormatter={(v: number) => String(Math.round(v * 10) / 10)}
              label={{ value: 'Time (h)', position: 'insideBottom', offset: -8, ...AXIS }}
            />
            <YAxis
              type="number"
              domain={[0, axis.max]}
              ticks={axis.ticks}
              stroke="#34525a"
              tick={AXIS}
              width={52}
              tickFormatter={(v: number) => String(Math.round(v * 1000) / 1000)}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, dx: -8, ...AXIS }}
            />
            <Tooltip
              cursor={{ stroke: '#46e0c8', strokeOpacity: 0.4 }}
              content={({ active: isActive, payload }) => {
                if (!isActive || !payload?.length) return null
                const row = payload[0].payload as ChartRow
                return (
                  <div className="rounded-md border border-ink-500 bg-ink-900/95 px-3 py-2 font-mono text-[11px] shadow-glass">
                    <div className="mb-1 text-muted">t = {row.t.toFixed(2)} h</div>
                    {active.map((s) => (
                      <div key={s.key} className="flex items-center gap-2" style={{ color: s.color }}>
                        <span className="inline-block h-1.5 w-3 rounded-full" style={{ background: s.color }} />
                        <span className="flex-1">{s.name}</span>
                        <span>
                          {row[s.key] !== undefined ? row[s.key]!.toFixed(3) : '—'} {s.unit}
                        </span>
                      </div>
                    ))}
                    {baselineLabel &&
                      active.map((s) => (
                        <div key={`b${s.key}`} className="flex items-center gap-2 text-muted">
                          <span className="inline-block h-0 w-3 border-t border-dashed" style={{ borderColor: s.color }} />
                          <span className="flex-1">{s.name} · {baselineLabel}</span>
                          <span>
                            {row[`b_${s.key}`] !== undefined ? row[`b_${s.key}`]!.toFixed(3) : '—'} {s.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                )
              }}
            />
            {refLines?.map((l) => (
              <ReferenceLine
                key={l.label}
                y={l.y}
                stroke={l.color}
                strokeDasharray="6 4"
                strokeOpacity={0.6}
                label={{ value: l.label, position: 'insideTopRight', fill: l.color, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}
              />
            ))}
            {baselineLabel &&
              active.map((s) => (
                <Line
                  key={`b_${s.key}`}
                  type="monotone"
                  dataKey={`b_${s.key}`}
                  name={`${s.name} (${baselineLabel})`}
                  stroke={s.color}
                  strokeOpacity={0.5}
                  strokeDasharray="5 4"
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            {active.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {baselineLabel && <p className="mt-1 text-[11px] text-dim">Dashed lines: saved baseline “{baselineLabel}” (clipped to this run’s duration).</p>}
      {exportError && (
        <p role="alert" className="mt-1 text-[11px] text-readout-product">
          {exportError}
        </p>
      )}
    </figure>
  )
}

export default memo(SeriesChart)
