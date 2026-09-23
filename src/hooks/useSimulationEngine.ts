import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { runSimulation, downsample, SimulationError } from '../simulation/integrator'
import { computeMetrics, runExtents, runningMetrics } from '../simulation/metrics'
import { interpretRun } from '../simulation/interpretation'
import { configWarnings } from '../simulation/validate'
import type {
  DerivedMetrics,
  ReactorConfig,
  RunExtents,
  RunningMetrics,
  SimPoint,
  SimulationResult,
} from '../simulation/types'

const CHART_RESOLUTION = 500
/** Minimum real time between React updates during playback (≈30 fps). */
const MIN_TICK_MS = 33

export interface Baseline {
  label: string
  config: ReactorConfig
  chartPoints: SimPoint[]
  metrics: DerivedMetrics
}

interface EngineState {
  config: ReactorConfig
  /** Human-readable name of the experiment currently being configured. */
  label: string
  modified: boolean
  fullResult: SimulationResult | null
  runLabel: string
  chartPoints: SimPoint[]
  running: RunningMetrics | null
  extents: RunExtents | null
  metrics: DerivedMetrics | null
  interpretation: string[]
  playbackIndex: number
  isPlaying: boolean
  speed: number // simulated hours per real second
  baseline: Baseline | null
  error: string | null
}

type Action =
  | { type: 'SET_CONFIG'; config: ReactorConfig }
  | { type: 'LOAD'; config: ReactorConfig; label: string }
  | { type: 'RUN' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'SEEK'; index: number }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'TICK'; index: number }
  | { type: 'SET_BASELINE' }
  | { type: 'CLEAR_BASELINE' }
  | { type: 'DISMISS_ERROR' }

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.config, modified: true }
    case 'LOAD':
      // Loading an experiment invalidates the previous run: its trajectory
      // and playback position describe a different system. A saved
      // comparison baseline deliberately survives so two experiments or
      // reactor modes can be overlaid.
      return {
        ...state,
        config: action.config,
        label: action.label,
        modified: false,
        fullResult: null,
        chartPoints: [],
        running: null,
        extents: null,
        metrics: null,
        interpretation: [],
        playbackIndex: 0,
        isPlaying: false,
        error: null,
      }
    case 'RUN': {
      try {
        const fullResult = runSimulation(state.config)
        const metrics = computeMetrics(fullResult)
        const chartPoints = downsample(fullResult.points, CHART_RESOLUTION)
        return {
          ...state,
          fullResult,
          runLabel: state.modified ? `${state.label} (edited)` : state.label,
          chartPoints,
          running: runningMetrics(chartPoints, state.config),
          extents: runExtents(fullResult.points),
          metrics,
          interpretation: interpretRun(fullResult, metrics),
          playbackIndex: 0,
          isPlaying: true,
          error: null,
        }
      } catch (e) {
        const message =
          e instanceof SimulationError ? e.message : 'The simulation could not be completed with these parameters.'
        return { ...state, isPlaying: false, error: message }
      }
    }
    case 'PLAY':
      if (!state.fullResult) return state
      if (state.playbackIndex >= state.chartPoints.length - 1) {
        return { ...state, playbackIndex: 0, isPlaying: true }
      }
      return { ...state, isPlaying: true }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'RESET':
      return { ...state, playbackIndex: 0, isPlaying: false }
    case 'SEEK': {
      const max = Math.max(state.chartPoints.length - 1, 0)
      return { ...state, playbackIndex: Math.min(Math.max(Math.round(action.index), 0), max), isPlaying: false }
    }
    case 'SET_SPEED':
      return { ...state, speed: action.speed }
    case 'TICK':
      return {
        ...state,
        playbackIndex: action.index,
        isPlaying: action.index < state.chartPoints.length - 1,
      }
    case 'SET_BASELINE':
      return state.fullResult && state.metrics
        ? {
            ...state,
            baseline: {
              label: state.runLabel,
              config: state.fullResult.config,
              chartPoints: state.chartPoints,
              metrics: state.metrics,
            },
          }
        : state
    case 'CLEAR_BASELINE':
      return { ...state, baseline: null }
    case 'DISMISS_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export function useSimulationEngine(initialConfig: ReactorConfig, initialLabel: string) {
  const [state, dispatch] = useReducer(reducer, {
    config: initialConfig,
    label: initialLabel,
    modified: false,
    fullResult: null,
    runLabel: initialLabel,
    chartPoints: [],
    running: null,
    extents: null,
    metrics: null,
    interpretation: [],
    playbackIndex: 0,
    isPlaying: false,
    speed: 4,
    baseline: null,
    error: null,
  })

  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!state.isPlaying || !state.fullResult) return

    const count = state.chartPoints.length
    const timePerPoint = count > 1 ? state.chartPoints[count - 1].t / (count - 1) : 0
    let elapsedSim = state.playbackIndex * timePerPoint
    let last: number | null = null
    let lastDispatch = 0
    let lastIndex = state.playbackIndex

    const step = (now: number) => {
      if (last === null) last = now
      // A long gap means the tab was hidden: resume where it left off
      // rather than skipping ahead. Slow frames still advance in real time.
      const gap = (now - last) / 1000
      const realDt = gap > 1 ? 0 : gap
      last = now
      elapsedSim += realDt * state.speed

      const idx = timePerPoint > 0 ? Math.floor(elapsedSim / timePerPoint) : count - 1
      const clamped = Math.min(idx, count - 1)
      const done = clamped >= count - 1

      if (clamped !== lastIndex && (done || now - lastDispatch >= MIN_TICK_MS)) {
        lastIndex = clamped
        lastDispatch = now
        dispatch({ type: 'TICK', index: clamped })
      }
      if (!done) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // Deliberately re-armed only by play state, speed and a new run; the
    // playback index is read once at start so ticks don't restart the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying, state.speed, state.fullResult])

  const setConfig = useCallback((config: ReactorConfig) => dispatch({ type: 'SET_CONFIG', config }), [])
  const load = useCallback((config: ReactorConfig, label: string) => dispatch({ type: 'LOAD', config, label }), [])
  const run = useCallback(() => dispatch({ type: 'RUN' }), [])
  const play = useCallback(() => dispatch({ type: 'PLAY' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const seek = useCallback((index: number) => dispatch({ type: 'SEEK', index }), [])
  const setSpeed = useCallback((speed: number) => dispatch({ type: 'SET_SPEED', speed }), [])
  const setBaseline = useCallback(() => dispatch({ type: 'SET_BASELINE' }), [])
  const clearBaseline = useCallback(() => dispatch({ type: 'CLEAR_BASELINE' }), [])
  const dismissError = useCallback(() => dispatch({ type: 'DISMISS_ERROR' }), [])

  /** Loads and immediately runs an experiment. */
  const loadAndRun = useCallback((config: ReactorConfig, label: string) => {
    dispatch({ type: 'LOAD', config, label })
    dispatch({ type: 'RUN' })
  }, [])

  /** Runs experiment A, keeps it as the baseline, then runs B on top of it. */
  const compare = useCallback(
    (a: { config: ReactorConfig; label: string }, b: { config: ReactorConfig; label: string }) => {
      dispatch({ type: 'LOAD', config: a.config, label: a.label })
      dispatch({ type: 'RUN' })
      dispatch({ type: 'SET_BASELINE' })
      dispatch({ type: 'LOAD', config: b.config, label: b.label })
      dispatch({ type: 'RUN' })
    },
    []
  )

  const warnings = useMemo(() => configWarnings(state.config), [state.config])

  const visiblePoints = useMemo(
    () => state.chartPoints.slice(0, state.playbackIndex + 1),
    [state.chartPoints, state.playbackIndex]
  )

  const currentPoint = visiblePoints[visiblePoints.length - 1] ?? null
  const progress = state.chartPoints.length > 1 ? state.playbackIndex / (state.chartPoints.length - 1) : 0

  return {
    config: state.config,
    label: state.label,
    modified: state.modified,
    runLabel: state.runLabel,
    /** Config that produced the displayed data (differs from `config` after edits). */
    runConfig: state.fullResult?.config ?? null,
    stale: state.fullResult !== null && state.fullResult.config !== state.config,
    warnings,
    error: state.error,
    dismissError,
    setConfig,
    load,
    loadAndRun,
    compare,
    run,
    play,
    pause,
    reset,
    seek,
    setSpeed,
    speed: state.speed,
    isPlaying: state.isPlaying,
    hasResult: state.fullResult !== null,
    fullResult: state.fullResult,
    chartPoints: state.chartPoints,
    playbackIndex: state.playbackIndex,
    visiblePoints,
    currentPoint,
    progress,
    running: state.running,
    extents: state.extents,
    metrics: state.metrics,
    interpretation: state.interpretation,
    baseline: state.baseline,
    setBaseline,
    clearBaseline,
  }
}

export type SimulationEngine = ReturnType<typeof useSimulationEngine>
