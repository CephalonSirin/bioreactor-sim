import { memo, useMemo } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import Segmented from '../ui/Segmented'
import { SERIES } from '../../lib/palette'
import type { SimPoint } from '../../simulation/types'

interface SimulationControlsProps {
  hasResult: boolean
  isPlaying: boolean
  stale: boolean
  progress: number
  time: number
  duration: number
  speed: number
  playbackIndex: number
  pointCount: number
  /** Full trajectory, drawn faintly behind the timeline for context. */
  points: SimPoint[]
  onRun: () => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSeek: (index: number) => void
  onSpeedChange: (speed: number) => void
  large?: boolean
  /** Rendered at the start of the button row (the panel heading). */
  lead?: React.ReactNode
  /** Extra control after reset (the run-length menu). */
  extra?: React.ReactNode
}

const SPEEDS = [1, 2, 4, 8, 20].map((s) => ({ value: s, label: `${s}×`, title: `${s} simulated hour${s > 1 ? 's' : ''} per second` }))

/** The run's X and S curves, normalised, as a strip behind the scrubber. */
function TimelineStrip({ points }: { points: SimPoint[] }) {
  const paths = useMemo(() => {
    if (points.length < 2) return null
    const step = Math.max(1, Math.floor(points.length / 160))
    const pts = points.filter((_, i) => i % step === 0 || i === points.length - 1)
    const tMax = pts[pts.length - 1].t || 1
    const line = (key: 'X' | 'S') => {
      const max = Math.max(...pts.map((p) => p[key]), 1e-9)
      return pts.map((p, i) => `${i ? 'L' : 'M'}${((p.t / tMax) * 1000).toFixed(1)} ${(30 - (p[key] / max) * 26).toFixed(1)}`).join(' ')
    }
    const x = line('X')
    return { x, s: line('S'), area: `${x} L1000 32 L0 32 Z` }
  }, [points])
  if (!paths) return null
  return (
    <svg viewBox="0 0 1000 32" preserveAspectRatio="none" className="sweep pointer-events-none absolute inset-x-0 top-0 h-full w-full" aria-hidden="true">
      <path d={paths.area} fill={SERIES.X} opacity="0.08" />
      <path d={paths.s} fill="none" stroke={SERIES.S} strokeWidth="1.2" opacity="0.45" vectorEffect="non-scaling-stroke" />
      <path d={paths.x} fill="none" stroke={SERIES.X} strokeWidth="1.4" opacity="0.7" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function SimulationControls({
  hasResult,
  isPlaying,
  stale,
  progress,
  time,
  duration,
  speed,
  playbackIndex,
  pointCount,
  points,
  onRun,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
  large = false,
  lead,
  extra,
}: SimulationControlsProps) {
  const atEnd = hasResult && progress >= 1
  const started = hasResult && progress > 0
  const pct = progress * 100

  return (
    <div className={`flex flex-col gap-3 ${large ? 'text-base' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        {lead}
        <button type="button" onClick={onRun} className={`${stale || !hasResult ? 'btn-accent' : 'btn-secondary'} ${large ? 'btn-lg' : ''}`} title="Integrate the model with the current parameters (R)">
          <Play className="fill-current" aria-hidden="true" />
          {!hasResult ? 'Run simulation' : stale ? 'Run with changes' : 'Run again'}
        </button>
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5">
          {isPlaying ? (
            <button type="button" onClick={onPause} className="icon-btn" aria-label="Pause playback" title="Pause (Space)">
              <Pause className="fill-current" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={onPlay} disabled={!hasResult} className="icon-btn disabled:opacity-40" aria-label={atEnd ? 'Replay' : started ? 'Resume playback' : 'Play'} title="Play (Space)">
              <Play className="fill-current" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onReset} disabled={!hasResult || (!started && !isPlaying)} className="icon-btn disabled:opacity-40" aria-label="Reset to t = 0" title="Reset to t = 0">
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
        {extra}
        <div className="ml-auto flex items-center gap-2">
          <span className="t-label hidden sm:inline">Speed</span>
          <Segmented value={speed} options={SPEEDS} onChange={onSpeedChange} label="Playback speed, simulated hours per second" itemClassName="!px-2 font-mono !text-label" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-8 min-w-0 flex-1">
          {hasResult && <TimelineStrip key={points.length ? points[points.length - 1].t + points[points.length - 1].X : 0} points={points} />}
          <div className="absolute inset-x-0 bottom-0 h-px bg-line" aria-hidden="true" />
          {hasResult && (
            // Playhead, aligned with the range thumb's centre (14 px thumb).
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-ink/70"
              style={{ left: `calc(${pct}% + ${7 - pct * 0.14}px)` }}
              aria-hidden="true"
            />
          )}
          <input
            type="range"
            aria-label="Simulation time"
            aria-valuetext={`${time.toFixed(1)} of ${duration.toFixed(0)} hours`}
            min={0}
            max={Math.max(pointCount - 1, 1)}
            step={1}
            value={playbackIndex}
            disabled={!hasResult}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ ['--pct' as string]: `${pct}%` }}
            className="timeline absolute inset-x-0 bottom-[-8px]"
          />
        </div>
        <output className={`num shrink-0 text-right font-mono text-ink ${large ? 'w-40 text-lg' : 'w-[7.5rem] text-ui'}`} aria-live="off">
          {time.toFixed(1)}
          <span className="text-ink-3"> / {duration.toFixed(0)} h</span>
        </output>
      </div>
      {stale && (
        <p className="text-label text-warn" role="status">
          Parameters changed. The charts and vessel still show the previous run until you run again.
        </p>
      )}
    </div>
  )
}

export default memo(SimulationControls)
