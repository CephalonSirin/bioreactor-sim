import { Component, Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import ReactorViz from '../viz/ReactorViz'
import AnimatedNumber from '../ui/AnimatedNumber'
import { ALL_LAYERS, LAYER_INFO, createBus } from './bus'
import type { LayerKey, Layers } from './bus'
import { PHASE_LABEL, visualSnapshot } from './visualState'
import type { CulturePhase, VisualSnapshot } from './visualState'
import { deviceTier, hasWebGL2, labEntrance } from './support'
import type { CaptureFn } from './ReactorCanvas'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery'
import type { ReactorConfig, ReactorType, RunExtents, SimPoint } from '../../simulation/types'

const ReactorCanvas = lazy(() => import('./ReactorCanvas'))

interface ReactorStageProps {
  point: SimPoint | null
  config: ReactorConfig
  extents: RunExtents | null
  playing: boolean
  variant: 'lab' | 'hero'
  /** Hero only: push the camera into the vessel before navigating. */
  leaving?: boolean
  large?: boolean
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
  captureRef?: React.MutableRefObject<CaptureFn | null>
}

const MODE_LINE: Record<ReactorType, [string, string]> = {
  batch: ['Batch', 'closed system'],
  fedbatch: ['Fed-batch', 'feeding, volume rising'],
  cstr: ['CSTR', 'continuous flow'],
}

const PHASE_TONE: Record<CulturePhase, string> = {
  initial: 'border-ink-500 text-muted',
  growth: 'border-readout-growth/60 text-readout-growth',
  limited: 'border-readout-biomass/60 text-readout-biomass',
  stationary: 'border-ink-500 text-muted',
  steady: 'border-aqua/60 text-aqua',
  approach: 'border-aqua/40 text-aqua',
  dilution: 'border-readout-product/60 text-readout-product',
  washout: 'border-readout-product bg-readout-product/15 text-readout-product',
}

class GLBoundary extends Component<{ fallback: ReactNode; onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function describe(s: VisualSnapshot): string {
  const p = s.point
  const [mode] = MODE_LINE[s.reactorType]
  return `3D ${mode} bioreactor at t = ${p.t.toFixed(1)} h. ${PHASE_LABEL[s.phase]}. Volume ${p.V.toFixed(2)} L, biomass ${p.X.toFixed(2)} g/L, substrate ${p.S.toFixed(2)} g/L, product ${p.P.toFixed(2)} g/L.${s.washedOut ? ' The culture has washed out.' : ''}`
}

function Readout({ label, sym, value, unit, color, digits = 2 }: { label: string; sym: string; value: number; unit: string; color: string; digits?: number }) {
  return (
    <div className="hud-tag" style={{ borderLeftColor: color }}>
      <div className="font-mono text-[9.5px] tracking-[0.14em] text-muted">
        <span className="uppercase">{label}</span> <span className="math not-italic text-[11px]" style={{ color }}>{sym}</span>
      </div>
      <div className="readout-value text-[15px] leading-tight text-paper">
        <AnimatedNumber value={value} digits={digits} duration={220} /> <span className="text-[10px] text-muted">{unit}</span>
      </div>
    </div>
  )
}

function IconButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`hud-btn ${pressed ? 'border-aqua/70 text-aqua' : ''}`}
    >
      {children}
    </button>
  )
}

function Hud({
  snap,
  config,
  playing,
  hasRun,
  duration,
  layers,
  onToggle,
  onReset,
  onZoom,
  showOrbitToggle,
  interactive,
  onInteractive,
  large,
}: {
  snap: VisualSnapshot
  config: ReactorConfig
  playing: boolean
  hasRun: boolean
  duration: number
  layers: Layers
  onToggle: (k: LayerKey) => void
  onReset: () => void
  onZoom: (dir: 1 | -1) => void
  showOrbitToggle: boolean
  interactive: boolean
  onInteractive: () => void
  large: boolean
}) {
  const [open, setOpen] = useState(false)
  const p = snap.point
  const [modeName, modeLine] = MODE_LINE[snap.reactorType]
  const progress = duration > 0 ? Math.min(p.t / duration, 1) : 0
  const status = playing ? 'running' : hasRun ? 'paused' : 'idle'

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      {/* Top: mode + clock and culture state, then live readouts */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="hud-tag min-w-[150px] border-l-aqua">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-aqua">
              <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'animate-pulse bg-aqua' : hasRun ? 'bg-readout-biomass' : 'bg-ink-500'}`} />
              {modeName} · {status}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted">{modeLine}</div>
            <div className={`readout-value mt-1 text-paper ${large ? 'text-xl' : 'text-base'}`}>
              t = <AnimatedNumber value={p.t} digits={1} duration={160} /> <span className="text-[10px] text-muted">/ {duration.toFixed(0)} h</span>
            </div>
            <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-ink-600">
              <div className="h-full origin-left bg-aqua transition-transform duration-200 ease-out" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>
          <div
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] backdrop-blur-md transition-colors duration-500 ${PHASE_TONE[snap.phase]}`}
            role="status"
            aria-live="polite"
          >
            {PHASE_LABEL[snap.phase]}
          </div>
        </div>

        {/* Middle: live readouts flanking the vessel */}
        <div className="pointer-events-none flex items-start justify-between gap-2">
          <div className="hidden flex-col gap-2 sm:flex">
            <Readout label="Biomass" sym="X" value={p.X} unit="g/L" color="#f0b545" />
            <Readout label="Substrate" sym="S" value={p.S} unit="g/L" color="#46e0c8" />
            <Readout label="Product" sym="P" value={p.P} unit="g/L" color="#f0805f" />
          </div>
          <div className="hidden flex-col items-end gap-2 sm:flex">
            <Readout label="Growth" sym="μ" value={p.mu} unit="h⁻¹" color="#9fd18a" digits={3} />
            <Readout label="Volume" sym="V" value={p.V} unit="L" color="#8fa6e8" />
            {snap.reactorType !== 'batch' && (
              <Readout label={snap.reactorType === 'cstr' ? 'Flow in = out' : 'Feed'} sym={snap.reactorType === 'cstr' ? 'DV' : 'F'} value={snap.flowIn} unit="L/h" color="#8fa6e8" digits={3} />
            )}
          </div>
        </div>

      </div>

      {snap.washedOut && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-4">
          <div className="animate-rise-in max-w-sm rounded-lg border border-readout-product/80 bg-ink-950/75 px-4 py-2 text-center backdrop-blur-md">
            <div className="font-mono text-sm font-semibold tracking-[0.24em] text-readout-product">WASHOUT</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted">
              D = {config.cstr.D.toFixed(2)} h⁻¹ outpaces net growth μ − k<sub>d</sub>: cells leave faster than they divide
            </div>
          </div>
        </div>
      )}

      {/* Bottom: visual layers + camera */}
      <div className="flex items-end justify-between gap-2">
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          {open && (
            <div className="hud-panel flex max-w-[330px] flex-wrap gap-1.5" role="group" aria-label="Visual layers">
              {LAYER_INFO.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => onToggle(l.key)}
                  aria-pressed={layers[l.key]}
                  title={l.hint}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    layers[l.key] ? 'border-ink-500 bg-ink-800/80 text-paper' : 'border-ink-600 text-dim line-through'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: layers[l.key] ? l.color : 'transparent', boxShadow: `0 0 0 1px ${l.color}` }} />
                  {l.label}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="hud-btn w-auto gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-wider">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M8 2 14 5 8 8 2 5Z M2 8l6 3 6-3 M2 11l6 3 6-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            Visual layers
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          {showOrbitToggle && (
            <IconButton label={interactive ? 'Lock view (scroll page)' : 'Rotate the reactor'} onClick={onInteractive} pressed={interactive}>
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M12 2v3H9M4 14v-3h3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </IconButton>
          )}
          <IconButton label="Zoom out" onClick={() => onZoom(-1)}>
            <span aria-hidden="true">−</span>
          </IconButton>
          <IconButton label="Zoom in" onClick={() => onZoom(1)}>
            <span aria-hidden="true">+</span>
          </IconButton>
          <IconButton label="Reset camera" onClick={onReset}>
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M3.5 2.5v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        </div>
      </div>
    </div>
  )
}

/**
 * The reactor as a 3D instrument, with a DOM HUD on top and the SVG
 * drawing as a fallback when WebGL is unavailable or fails. Simulation
 * updates only write to a mutable bus; the WebGL scene reads it per frame.
 */
function ReactorStage({ point, config, extents, playing, variant, leaving = false, large = false, className = '', svgRef, captureRef }: ReactorStageProps) {
  const reduced = useReducedMotion()
  const coarse = useMediaQuery('(pointer: coarse)')
  const compact = useMediaQuery('(max-width: 640px)')
  const [tier] = useState(deviceTier)
  const [entrance] = useState<'hero' | 'normal' | 'none'>(() => {
    if (variant !== 'lab') return 'none'
    const e = labEntrance.fromHero ? 'hero' : 'normal'
    labEntrance.fromHero = false
    return e
  })
  const [webgl] = useState(hasWebGL2)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [layers, setLayers] = useState<Layers>(ALL_LAYERS)
  const [interactive, setInteractive] = useState(!coarse)
  const root = useRef<HTMLDivElement>(null)

  const snap = useMemo(() => visualSnapshot(point, config, extents), [point, config, extents])
  const busRef = useRef<ReturnType<typeof createBus> | null>(null)
  if (!busRef.current) busRef.current = createBus(snap.targets, reduced)
  const bus = busRef.current
  if (bus.target !== snap.targets) {
    bus.target = snap.targets
    bus.settled = false // wake the frame pacer immediately (seek, new run)
  }
  bus.playing = playing
  bus.reduced = reduced
  bus.leaving = leaving

  // Only render frames while the stage is on screen.
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Hero: pointer parallax is fed straight into the bus (no re-render).
  useEffect(() => {
    if (variant !== 'hero' || reduced) return
    const onMove = (e: PointerEvent) => {
      bus.pointer.x = e.clientX / window.innerWidth - 0.5
      bus.pointer.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [variant, reduced, bus])

  const onToggle = useCallback((k: LayerKey) => setLayers((l) => ({ ...l, [k]: !l[k] })), [])
  const onReset = useCallback(() => bus.camera?.reset(), [bus])
  const onZoom = useCallback((dir: 1 | -1) => bus.camera?.dolly(dir * 1.4), [bus])
  const onReady = useCallback(() => setReady(true), [])
  const onLost = useCallback(() => setFailed(true), [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cam = bus.camera
    if (!cam || e.target !== e.currentTarget) return
    const map: Record<string, () => void> = {
      ArrowLeft: () => cam.rotate(-0.3, 0),
      ArrowRight: () => cam.rotate(0.3, 0),
      ArrowUp: () => cam.rotate(0, -0.12),
      ArrowDown: () => cam.rotate(0, 0.12),
      '+': () => cam.dolly(1.2),
      '=': () => cam.dolly(1.2),
      '-': () => cam.dolly(-1.2),
      '0': () => cam.reset(),
      Home: () => cam.reset(),
    }
    const fn = map[e.key]
    if (fn) {
      e.preventDefault()
      fn()
    }
  }

  const duration = extents?.duration || config.settings.duration
  const fallback = (
    <div className="flex h-full w-full items-center justify-center p-4">
      <ReactorViz svgRef={svgRef} point={point} config={config} extents={extents} playing={playing} showLegend={variant === 'lab'} className="h-full max-h-full w-auto max-w-full" />
    </div>
  )
  const use3d = webgl && !failed
  const isLab = variant === 'lab'

  return (
    <div
      ref={root}
      className={`reactor-stage relative overflow-hidden ${className}`}
      tabIndex={isLab && use3d ? 0 : undefined}
      onKeyDown={isLab ? onKeyDown : undefined}
      role={isLab ? 'group' : 'img'}
      aria-roledescription={isLab ? '3D reactor view' : undefined}
      aria-label={`${describe(snap)}${isLab && use3d ? ' Drag or use arrow keys to rotate, plus and minus to zoom, 0 to reset the camera.' : ''}`}
    >
      <div className="stage-glow" aria-hidden="true" style={{ opacity: 0.55 + 0.45 * snap.targets.turbidity }} />
      {use3d ? (
        <GLBoundary fallback={fallback} onError={onLost}>
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}>
              <ReactorCanvas
                bus={bus}
                mode={config.reactorType}
                layers={layers}
                variant={variant}
                tier={tier}
                active={active}
                interactive={isLab && interactive}
                compact={compact}
                entrance={entrance}
                captureRef={captureRef}
                onReady={onReady}
                onLost={onLost}
              />
            </div>
          </Suspense>
          {!ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim">Initialising instrument…</span>
            </div>
          )}
        </GLBoundary>
      ) : (
        fallback
      )}
      {isLab && use3d && (
        <Hud
          snap={snap}
          config={config}
          playing={playing}
          hasRun={extents !== null}
          duration={duration}
          layers={layers}
          onToggle={onToggle}
          onReset={onReset}
          onZoom={onZoom}
          showOrbitToggle={coarse}
          interactive={interactive}
          onInteractive={() => setInteractive((v) => !v)}
          large={large}
        />
      )}
    </div>
  )
}

export default memo(ReactorStage)
