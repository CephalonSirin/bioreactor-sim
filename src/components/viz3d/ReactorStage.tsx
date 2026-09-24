import { Component, Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import ReactorViz from '../viz/ReactorViz'
import { Check, Crosshair, Layers3, Minus, Plus, Rotate3d } from 'lucide-react'
import Popover from '../ui/Popover'
import ReactorGlyph from '../viz/ReactorGlyph'
import { ALL_LAYERS, LAYER_INFO, createBus } from './bus'
import type { LayerKey, Layers } from './bus'
import { PHASE_LABEL, visualSnapshot } from './visualState'
import type { VisualSnapshot } from './visualState'
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
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
  captureRef?: React.MutableRefObject<CaptureFn | null>
}

const MODE_LINE: Record<ReactorType, [string, string]> = {
  batch: ['Batch', 'closed vessel'],
  fedbatch: ['Fed-batch', 'feeding, volume rising'],
  cstr: ['CSTR', 'continuous flow'],
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

function Hud({
  snap,
  config,
  layers,
  onToggle,
  onReset,
  onZoom,
  showOrbitToggle,
  interactive,
  onInteractive,
}: {
  snap: VisualSnapshot
  config: ReactorConfig
  layers: Layers
  onToggle: (k: LayerKey) => void
  onReset: () => void
  onZoom: (dir: 1 | -1) => void
  showOrbitToggle: boolean
  interactive: boolean
  onInteractive: () => void
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex justify-end">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-md border border-line bg-surface/90 p-0.5 shadow-lift backdrop-blur-sm">
          <Popover
            origin="top-right"
            label="Visual layers"
            panelClassName="w-[300px]"
            trigger={(t) => (
              <button type="button" {...t} className="icon-btn" aria-label="Visual layers" title="Visual layers">
                <Layers3 aria-hidden="true" />
              </button>
            )}
          >
            {() => (
              <div className="menu">
                <p className="px-2.5 pb-1 pt-1.5 text-label font-semibold text-ink">What the vessel shows</p>
                {LAYER_INFO.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={layers[l.key]}
                    onClick={() => onToggle(l.key)}
                    className="menu-item !items-start"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150 ${
                        layers[l.key] ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="!h-3 !w-3 !text-current" strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <span className="swatch" style={{ color: l.color }} />
                        {l.label}
                      </span>
                      <span className="mt-0.5 block text-micro leading-snug text-ink-3">{l.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Popover>
          <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
          {showOrbitToggle && (
            <button type="button" onClick={onInteractive} aria-pressed={interactive} className="icon-btn" aria-label={interactive ? 'Lock view so the page scrolls' : 'Rotate the vessel'} title="Rotate">
              <Rotate3d aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => onZoom(-1)} className="icon-btn" aria-label="Zoom out" title="Zoom out">
            <Minus aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onZoom(1)} className="icon-btn" aria-label="Zoom in" title="Zoom in">
            <Plus aria-hidden="true" />
          </button>
          <button type="button" onClick={onReset} className="icon-btn" aria-label="Reset camera" title="Reset camera (0)">
            <Crosshair aria-hidden="true" />
          </button>
        </div>
      </div>

      {snap.washedOut && (
        <div className="flex justify-center px-2">
          <div className="pop-in max-w-md rounded-md border border-danger-line bg-surface/95 px-3.5 py-2 text-center shadow-lift" role="status">
            <p className="text-ui font-semibold text-danger">Washout</p>
            <p className="mt-0.5 text-label leading-snug text-ink-2">
              D = {config.cstr.D.toFixed(2)} h⁻¹ exceeds the net growth rate μ − k<sub>d</sub>: cells leave faster than they divide.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * The reactor as a 3D instrument, with a DOM HUD on top and the SVG
 * drawing as a fallback when WebGL is unavailable or fails. Simulation
 * updates only write to a mutable bus; the WebGL scene reads it per frame.
 */
function ReactorStage({ point, config, extents, playing, variant, leaving = false, className = '', svgRef, captureRef }: ReactorStageProps) {
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
              <span className="flex flex-col items-center gap-3 text-ink-4">
                <ReactorGlyph type={config.reactorType} className="breathe flow-live h-24 w-32" />
                <span className="text-label text-ink-3">Preparing the 3D vessel</span>
              </span>
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
          layers={layers}
          onToggle={onToggle}
          onReset={onReset}
          onZoom={onZoom}
          showOrbitToggle={coarse}
          interactive={interactive}
          onInteractive={() => setInteractive((v) => !v)}
        />
      )}
    </div>
  )
}

export default memo(ReactorStage)
