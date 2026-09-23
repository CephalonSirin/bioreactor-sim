import { memo } from 'react'

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
  onRun: () => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSeek: (index: number) => void
  onSpeedChange: (speed: number) => void
  large?: boolean
}

const SPEEDS = [1, 2, 4, 8, 20]

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
  onRun,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
  large = false,
}: SimulationControlsProps) {
  const atEnd = hasResult && progress >= 1
  const started = hasResult && progress > 0
  const pct = Math.round(progress * 100)

  return (
    <div className={`glass frame flex flex-col gap-3 ${large ? 'p-5' : 'p-3.5'}`}>
      {stale && (
        <p className="rounded border border-readout-biomass/40 bg-readout-biomass/10 px-3 py-1.5 text-xs text-readout-biomass" role="status">
          Parameters changed since the last run. Press “Run experiment” to update the results.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRun} className={`btn-primary ${large ? 'px-6 py-3 text-base' : ''}`}>
          <span aria-hidden="true">▶</span> {hasResult ? 'Re-run experiment' : 'Run experiment'}
        </button>
        {isPlaying ? (
          <button type="button" onClick={onPause} className="btn-ghost">
            <span aria-hidden="true">❚❚</span> Pause
          </button>
        ) : (
          <button type="button" onClick={onPlay} disabled={!hasResult} className="btn-ghost">
            <span aria-hidden="true">▶</span> {atEnd ? 'Replay' : started ? 'Resume' : 'Play'}
          </button>
        )}
        <button type="button" onClick={onReset} disabled={!hasResult || (!started && !isPlaying)} className="btn-ghost">
          <span aria-hidden="true">↺</span> Reset
        </button>

        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Playback speed">
          <span className="mr-1 hidden font-mono text-[10px] uppercase tracking-wider text-muted sm:inline">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={speed === s}
              onClick={() => onSpeedChange(s)}
              title={`${s} simulated hour${s > 1 ? 's' : ''} per real second`}
              className={`rounded border px-2 py-1 font-mono text-xs transition-colors ${
                speed === s ? 'border-aqua bg-aqua/15 text-aqua' : 'border-ink-500 text-muted hover:border-aqua/60 hover:text-paper'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`readout-value shrink-0 text-paper ${large ? 'w-44 text-xl' : 'w-32 text-sm'}`}>
          t = {time.toFixed(1)}
          <span className="text-muted"> / {duration.toFixed(0)} h</span>
        </span>
        <input
          type="range"
          aria-label="Simulation timeline"
          aria-valuetext={`${time.toFixed(1)} hours of ${duration.toFixed(0)} (${pct} percent)`}
          min={0}
          max={Math.max(pointCount - 1, 1)}
          step={1}
          value={playbackIndex}
          disabled={!hasResult}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{ ['--slider-fill' as string]: '#46e0c8', ['--slider-pct' as string]: `${pct}%` }}
          className="disabled:opacity-40"
        />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-muted">{pct}%</span>
      </div>
      <p className="text-[11px] text-dim">
        Speed = simulated hours per real second. Charts, metrics and the reactor all read from the same precomputed trajectory, so scrubbing the timeline moves them together.
      </p>
    </div>
  )
}

export default memo(SimulationControls)
