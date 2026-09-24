import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import ReactorStage from '../viz3d/ReactorStage'
import AnimatedNumber from '../ui/AnimatedNumber'
import { downsample, runSimulation } from '../../simulation/integrator'
import { runExtents } from '../../simulation/metrics'
import { defaultConfigFor } from '../../simulation/presets'
import { hrefFor, navigate } from '../../hooks/useHashRoute'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { PHASE_LABEL, visualSnapshot } from '../viz3d/visualState'
import { labEntrance } from '../viz3d/support'
import { SERIES } from '../../lib/palette'

const RUN_SECONDS = 15
const HOLD_SECONDS = 2.5
const LEAVE_MS = 700

/**
 * The hero vessel is a real simulation (the default batch run) played on
 * a loop, so the first thing a visitor sees is the engine itself.
 */
function useDemoRun() {
  return useMemo(() => {
    const config = { ...defaultConfigFor('batch'), settings: { duration: 26, dt: 0.02 } }
    const result = runSimulation(config)
    const points = downsample(result.points, 260)
    return { config, points, extents: runExtents(result.points) }
  }, [])
}

const rise = (i: number) => ({ ['--d' as string]: `${120 + i * 70}ms` })

export default function Hero() {
  const demo = useDemoRun()
  const hero = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(Math.round(demo.points.length * 0.42))
  const [playing, setPlaying] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // Loop the demo while the hero is on screen (and motion is allowed).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = hero.current
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    if (el) io.observe(el)

    const n = demo.points.length
    let raf = 0
    let start = performance.now()
    let lastIdx = -1
    setPlaying(true)
    const tick = (now: number) => {
      if (visible) {
        const elapsed = (now - start) / 1000
        if (elapsed > RUN_SECONDS + HOLD_SECONDS) start = now
        const k = Math.min(elapsed / RUN_SECONDS, 1)
        const idx = Math.floor(k * (n - 1))
        if (idx !== lastIdx) {
          lastIdx = idx
          setIndex(idx)
        }
      } else {
        start = now - (lastIdx / (n - 1)) * RUN_SECONDS * 1000
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [demo])

  // Entering the Lab: the camera pushes into the vessel, the page fades,
  // and the Lab camera pulls back out of the same vessel.
  const enterLab = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (leaving) return
    setLeaving(true)
    labEntrance.fromHero = true
    window.setTimeout(() => navigate('lab'), LEAVE_MS)
  }

  const point = demo.points[index]
  const snap = useMemo(() => visualSnapshot(point, demo.config, demo.extents), [point, demo])

  // The live figure beside the vessel: X and S drawn up to the current time.
  const curve = useMemo(() => {
    const W = 320
    const H = 96
    const tMax = demo.points[demo.points.length - 1].t
    const visible = demo.points.slice(0, index + 1)
    const xs = (t: number) => (t / tMax) * W
    const path = (key: 'X' | 'S', max: number) => visible.map((p, i) => `${i ? 'L' : 'M'}${xs(p.t).toFixed(1)} ${(H - 6 - (p[key] / max) * (H - 14)).toFixed(1)}`).join(' ')
    return { W, H, X: path('X', demo.extents.maxX * 1.05), S: path('S', demo.extents.maxS * 1.05), head: xs(point.t) }
  }, [index, demo, point])

  const fade = `transition-[opacity,transform] duration-500 ease-out ${leaving ? 'opacity-0 -translate-y-1' : ''}`

  return (
    <section ref={hero} className="relative overflow-hidden border-b border-line" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-page items-center gap-x-10 px-4 sm:px-6 lg:min-h-[calc(100svh-var(--nav-h))] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className={`relative z-10 pb-10 pt-6 lg:py-20 ${fade}`}>
          <h1 id="hero-title" className="t-display max-w-[12ch] text-ink">
            <span className="rise block" style={rise(0)}>
              Watch a culture grow, starve or wash out.
            </span>
          </h1>
          <p className="rise t-lede mt-6 max-w-[34rem]" style={rise(1)}>
            Bioreactor Lab simulates batch, fed-batch and continuous stirred-tank reactors in your browser. Monod kinetics and mass balances, integrated with a Runge–Kutta solver, drive the vessel, the measurements and the figures from one trajectory.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3" style={rise(2)}>
            <a href={hrefFor('lab')} onClick={enterLab} className="btn-primary btn-lg group">
              Open the Lab
              <ArrowRight className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a href={hrefFor('methodology')} className="btn-ghost btn-lg">
              How the model works
            </a>
          </div>

          {/* Live readout of the demonstration run */}
          <figure className="rise mt-12 max-w-[34rem] border-t border-line pt-5" style={rise(3)} aria-label="Live readout of the demonstration run">
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'Biomass', sym: 'X', v: point.X, unit: 'g/L', c: SERIES.X, d: 2 },
                { name: 'Substrate', sym: 'S', v: point.S, unit: 'g/L', c: SERIES.S, d: 2 },
                { name: 'Growth rate', sym: 'μ', v: point.mu, unit: 'h⁻¹', c: SERIES.mu, d: 3 },
              ].map((r) => (
                <div key={r.sym} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-label text-ink-3">
                    <span className="swatch" style={{ color: r.c }} aria-hidden="true" />
                    {r.name} <span className="math text-[13px]">{r.sym}</span>
                  </div>
                  <div className="num mt-1 font-mono text-[22px] font-medium tracking-[-0.02em] text-ink">
                    <AnimatedNumber value={r.v} digits={r.d} duration={140} />
                    <span className="ml-1 text-micro text-ink-3">{r.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <svg viewBox={`0 0 ${curve.W} ${curve.H}`} className="mt-4 h-[96px] w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Biomass rising and substrate falling in the demonstration run, drawn up to the current time">
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1="0" x2={curve.W} y1={curve.H * f} y2={curve.H * f} stroke="#ECECE8" vectorEffect="non-scaling-stroke" />
              ))}
              <line x1="0" x2={curve.W} y1={curve.H - 1} y2={curve.H - 1} stroke="#CBCBC5" vectorEffect="non-scaling-stroke" />
              <path d={curve.S} fill="none" stroke={SERIES.S} strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={curve.X} fill="none" stroke={SERIES.X} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <line x1={curve.head} x2={curve.head} y1="0" y2={curve.H} stroke="#17191C" strokeOpacity="0.25" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
            </svg>
            <figcaption className="mt-2 flex items-center justify-between gap-3 text-micro text-ink-3">
              <span>{reduced ? 'Default batch run' : 'Default batch run, looped'}</span>
              <span className="num font-mono">
                {PHASE_LABEL[snap.phase]} · t = {point.t.toFixed(1)} h
              </span>
            </figcaption>
          </figure>
        </div>

        <div className="relative order-first -mx-4 sm:mx-0 lg:order-none lg:-mr-6">
          <ReactorStage
            variant="hero"
            point={point}
            config={demo.config}
            extents={demo.extents}
            playing={playing}
            leaving={leaving}
            className="h-[360px] sm:h-[520px] lg:h-[min(84vh,780px)]"
          />
        </div>
      </div>
      <div className={`pointer-events-none absolute inset-0 z-20 bg-canvas transition-opacity duration-700 ease-out ${leaving ? 'opacity-70' : 'opacity-0'}`} aria-hidden="true" />
    </section>
  )
}
