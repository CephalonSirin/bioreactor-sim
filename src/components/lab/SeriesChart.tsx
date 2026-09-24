import { memo, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { downloadSvgAsPng } from '../../lib/exportImage'
import { niceAxis } from '../../lib/axis'
import { FONT, INK } from '../../lib/palette'

export interface SeriesDef {
  key: string
  name: string
  /** Math symbol shown in the key and tooltip. */
  symbol?: string
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
  figure: string
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
  /** One-line description of what is plotted. */
  caption?: string
  /** Vertical event markers (time, label), shown once playback reaches them. */
  events?: { t: number; label: string }[]
}

const TICK = { fontSize: 11, fill: INK[3], fontFamily: FONT.mono }
const AXIS_LABEL = { fontSize: 11, fill: INK[3], fontFamily: FONT.sans }

/**
 * One figure: a line chart drawn progressively as the run plays, with the
 * newest point marked like a pen tip. Series identity is carried by the
 * key (line swatch + name), never by coloured text.
 */
function SeriesChart({
  figure,
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
  caption,
  events,
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
  const last = data.length - 1
  const tipDot = (color: string) =>
    function Tip(props: { cx?: number; cy?: number; index?: number }) {
      if (props.index !== last || props.cx === undefined || props.cy === undefined) return <g key={props.index} />
      return <circle key="tip" cx={props.cx} cy={props.cy} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />
    }

  const handleDownload = async () => {
    const svg = box.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null
    if (!svg) return
    try {
      setExportError(null)
      await downloadSvgAsPng(svg, `${fileBase}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, {
        caption: `${figure}. ${title}. Bioreactor Lab (educational model)`,
      })
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Image export failed.')
    }
  }

  return (
    <figure className="flex min-w-0 flex-col" aria-label={`${figure}: ${title}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <figcaption className="min-w-0">
          <span className="flex items-baseline gap-2 text-ui font-semibold text-ink">
            <span className="font-mono text-label font-normal text-ink-3">{figure}</span>
            {title}
          </span>
          {caption && <span className="mt-0.5 block text-label text-ink-3">{caption}</span>}
        </figcaption>
        <div className="flex flex-wrap items-center gap-1">
          {series.length > 1 &&
            series.map((s) => {
              const on = visibleKeys.has(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(s.key)}
                  className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-label transition-[color,background-color,opacity] duration-150 hover:bg-sunken ${on ? 'text-ink-2' : 'text-ink-4'}`}
                  title={on ? `Hide ${s.name}` : `Show ${s.name}`}
                >
                  <span className="swatch transition-opacity duration-150" style={{ color: s.color, opacity: on ? 1 : 0.3 }} aria-hidden="true" />
                  <span className={on ? '' : 'line-through decoration-ink-4'}>{s.name}</span>
                </button>
              )
            })}
          <button type="button" onClick={handleDownload} className="icon-btn !h-7 !w-7" aria-label={`Download ${title} as PNG`} title="Download PNG">
            <Download className="!h-3.5 !w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={box} className="-ml-2">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 18 }}>
            <CartesianGrid stroke="#ECECE8" vertical={false} />
            <XAxis
              type="number"
              dataKey="t"
              domain={[0, duration]}
              ticks={xTicks}
              stroke={INK.lineStrong}
              tickLine={{ stroke: INK.lineStrong }}
              tick={TICK}
              tickFormatter={(v: number) => String(Math.round(v * 10) / 10)}
              label={{ value: 'Time (h)', position: 'insideBottom', offset: -12, ...AXIS_LABEL }}
            />
            <YAxis
              type="number"
              domain={[0, axis.max]}
              ticks={axis.ticks}
              axisLine={false}
              tickLine={false}
              tick={TICK}
              width={50}
              tickFormatter={(v: number) => String(Math.round(v * 1000) / 1000)}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 14, dx: -6, ...AXIS_LABEL }}
            />
            <Tooltip
              cursor={{ stroke: INK[3], strokeWidth: 1, strokeDasharray: '3 3' }}
              isAnimationActive={false}
              content={({ active: isActive, payload }) => {
                if (!isActive || !payload?.length) return null
                const row = payload[0].payload as ChartRow
                return (
                  <div className="min-w-[180px] rounded-md border border-line bg-surface px-3 py-2 text-label shadow-pop">
                    <div className="num mb-1.5 font-mono text-micro text-ink-3">t = {row.t.toFixed(2)} h</div>
                    {active.map((s) => (
                      <div key={s.key} className="flex items-center gap-2 py-0.5">
                        <span className="swatch" style={{ color: s.color }} />
                        <span className="flex-1 text-ink-2">{s.name}</span>
                        <span className="num font-mono text-ink">{row[s.key] !== undefined ? row[s.key]!.toFixed(3) : '—'}</span>
                        <span className="w-7 font-mono text-micro text-ink-3">{s.unit}</span>
                      </div>
                    ))}
                    {baselineLabel &&
                      active.map((s) => (
                        <div key={`b${s.key}`} className="flex items-center gap-2 py-0.5">
                          <span className="swatch swatch-dashed" style={{ color: s.color }} />
                          <span className="flex-1 text-ink-3">{s.name}, baseline</span>
                          <span className="num font-mono text-ink-2">{row[`b_${s.key}`] !== undefined ? row[`b_${s.key}`]!.toFixed(3) : '—'}</span>
                          <span className="w-7 font-mono text-micro text-ink-3">{s.unit}</span>
                        </div>
                      ))}
                  </div>
                )
              }}
            />
            {events
              ?.filter((ev) => ev.t <= (data[last]?.t ?? 0))
              .map((ev) => (
                <ReferenceLine
                  key={ev.label}
                  x={ev.t}
                  stroke={INK[3]}
                  strokeDasharray="2 3"
                  label={{ value: ev.label, position: 'insideTopLeft', fill: INK[2], fontSize: 11, fontFamily: FONT.sans, dx: 4 }}
                />
              ))}
            {refLines?.map((l) => (
              <ReferenceLine
                key={l.label}
                y={l.y}
                stroke={l.color}
                strokeDasharray="2 3"
                strokeOpacity={0.9}
                label={{ value: l.label, position: 'insideTopRight', fill: INK[2], fontSize: 11, fontFamily: FONT.mono }}
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
                  strokeOpacity={0.55}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
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
                strokeWidth={2}
                dot={tipDot(s.color)}
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: s.color }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {exportError && (
        <p role="alert" className="mt-1 text-label text-danger">
          {exportError}
        </p>
      )}
    </figure>
  )
}

export default memo(SeriesChart)
