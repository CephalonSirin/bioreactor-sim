import { useEffect, useMemo, useRef, useState } from 'react'
import ReactorViz from '../viz/ReactorViz'
import AnimatedNumber from '../ui/AnimatedNumber'
import MolecularField from './MolecularField'
import { downsample, runSimulation } from '../../simulation/integrator'
import { runExtents } from '../../simulation/metrics'
import { defaultConfigFor } from '../../simulation/presets'
import { hrefFor } from '../../hooks/useHashRoute'

const RUN_SECONDS = 15
const HOLD_SECONDS = 2.5

/**
 * The hero reactor is a real simulation (healthy batch growth) played on
 * a loop, so the showpiece is driven by the same engine as the Lab.
 */
function useDemoRun() {
  return useMemo(() => {
    const config = { ...defaultConfigFor('batch'), settings: { duration: 26, dt: 0.02 } }
    const result = runSimulation(config)
    const points = downsample(result.points, 260)
    return { config, points, extents: runExtents(result.points) }
  }, [])
}

export default function Hero() {
  const demo = useDemoRun()
  const stage = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(Math.round(demo.points.length * 0.42))
  const [playing, setPlaying] = useState(false)

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
        const total = RUN_SECONDS + HOLD_SECONDS
        if (elapsed > total) start = now
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

  // Pointer parallax + scroll depth, written as CSS variables (no re-render).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = hero.current
    if (!el) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.setProperty('--px', px.toFixed(3))
        el.style.setProperty('--py', py.toFixed(3))
      })
    }
    const onScroll = () => el.style.setProperty('--sy', String(Math.min(window.scrollY, 800)))
    el.addEventListener('pointermove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const point = demo.points[index]
  const visible = demo.points.slice(0, index + 1)
  const curve = useMemo(() => {
    const W = 230
    const H = 70
    const tMax = demo.points[demo.points.length - 1].t
    const path = (key: 'X' | 'S', max: number) =>
      visible.map((p, i) => `${i ? 'L' : 'M'}${((p.t / tMax) * W).toFixed(1)} ${(H - 4 - (p[key] / max) * (H - 10)).toFixed(1)}`).join(' ')
    return { W, H, X: path('X', demo.extents.maxX * 1.05), S: path('S', demo.extents.maxS * 1.05) }
  }, [visible, demo])

  return (
    <section ref={hero} className="relative isolate overflow-hidden" style={{ ['--px' as string]: 0, ['--py' as string]: 0, ['--sy' as string]: 0 }} aria-labelledby="hero-title">
      <MolecularField />
      <div className="relative mx-auto grid min-h-[calc(100svh-56px)] max-w-[1360px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-8">
        <div className="animate-rise-in">
          <div className="eyebrow mb-5 flex items-center gap-2">
            <span className="h-px w-8 bg-aqua" aria-hidden="true" />
            Interactive biotechnology laboratory
          </div>
          <h1 id="hero-title" className="font-display text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl xl:text-7xl">
            Watch a culture
            <br />
            <span className="bg-gradient-to-r from-aqua to-readout-biomass bg-clip-text text-transparent">grow, starve, or wash out.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Run batch, fed-batch and continuous bioreactors in your browser. Monod kinetics, real mass balances and a vessel that responds to every number in the model.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={hrefFor('lab')} className="btn-primary px-6 py-3 text-base">
              Enter the Bioreactor Lab <span aria-hidden="true">→</span>
            </a>
            <a href={hrefFor('learn')} className="btn-ghost px-6 py-3 text-base">
              Explore the Science
            </a>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-600/70 pt-5 font-mono text-xs">
            {[
              ['3', 'reactor modes'],
              ['8', 'guided experiments'],
              ['RK4', 'numerical solver'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-2xl font-medium text-paper">{v}</dd>
                <dd className="mt-0.5 text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div ref={stage} className="relative mx-auto w-full max-w-[520px]" style={{ animation: 'rise-in 1s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div
            className="absolute inset-0 -z-10 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(closest-side, rgba(70,224,200,0.22), transparent 70%)', transform: 'translate3d(calc(var(--px) * -20px), calc(var(--py) * -20px), 0)' }}
            aria-hidden="true"
          />
          <div
            className="transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: 'perspective(1000px) rotateY(calc(var(--px) * 7deg)) rotateX(calc(var(--py) * -5deg))' }}
          >
            <div className="animate-float">
              <ReactorViz point={point} config={demo.config} extents={demo.extents} playing={playing} showLegend={false} className="h-auto w-full" />
            </div>
          </div>

          {[
            { label: 'Biomass', value: point.X, unit: 'g/L', color: '#f0b545', pos: 'left-0 top-[18%]', digits: 2 },
            { label: 'Substrate', value: point.S, unit: 'g/L', color: '#46e0c8', pos: 'right-0 top-[30%]', digits: 2 },
            { label: 'Growth rate μ', value: point.mu, unit: 'h⁻¹', color: '#9fd18a', pos: 'right-0 top-[58%]', digits: 3 },
          ].map((c) => (
            <div
              key={c.label}
              className={`glass absolute hidden px-3 py-2 sm:block ${c.pos}`}
              style={{ borderLeft: `3px solid ${c.color}`, transform: 'translate3d(calc(var(--px) * 14px), calc(var(--py) * 10px), 0)' }}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">{c.label}</div>
              <div className="readout-value text-lg text-paper">
                <AnimatedNumber value={c.value} digits={c.digits} duration={200} /> <span className="text-xs text-muted">{c.unit}</span>
              </div>
            </div>
          ))}

          <div className="glass absolute -bottom-14 left-0 hidden w-[260px] p-3 sm:block">
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
              <span>Live from the model</span>
              <span className="text-aqua">t = {point.t.toFixed(1)} h</span>
            </div>
            <svg viewBox={`0 0 ${curve.W} ${curve.H}`} className="h-[70px] w-full" role="img" aria-label="Biomass and substrate curves of the demonstration run so far">
              <line x1="0" x2={curve.W} y1={curve.H - 3} y2={curve.H - 3} stroke="#22393f" />
              <path d={curve.S} fill="none" stroke="#46e0c8" strokeWidth="1.8" />
              <path d={curve.X} fill="none" stroke="#f0b545" strokeWidth="2.2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
