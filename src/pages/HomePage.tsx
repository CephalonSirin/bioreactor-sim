import { useEffect, useRef } from 'react'
import Hero from '../components/home/Hero'
import Reveal from '../components/ui/Reveal'
import ExperimentCard from '../components/experiments/ExperimentCard'
import ReactorGlyph from '../components/viz/ReactorGlyph'
import { MonodExplorer } from '../components/learn/Interactives'
import { Eq } from '../components/ui/Eq'
import { hrefFor } from '../hooks/useHashRoute'
import { PRESETS, presetById } from '../simulation/presets'
import type { Preset } from '../simulation/presets'
import type { ReactorType } from '../simulation/types'

interface HomePageProps {
  onLaunchReactor: (type: ReactorType) => void
  onRunPreset: (preset: Preset) => void
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      el.textContent = `${to}${suffix}`
      return
    }
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const k = Math.min((now - start) / 1200, 1)
        el.textContent = `${Math.round((1 - Math.pow(1 - k, 3)) * to)}${suffix}`
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, suffix])
  return <span ref={ref}>0{suffix}</span>
}

const STATS = [
  { to: 3, label: 'reactor modes', note: 'batch, fed-batch, CSTR' },
  { to: 8, label: 'curated experiments', note: 'each with the science explained' },
  { to: 4, label: 'coupled equations', note: 'biomass, substrate, product, volume' },
  { to: 10, label: 'learning topics', note: 'concept, then equation, then play' },
]

const MODES: { type: ReactorType; name: string; line: string; eq: string; text: string }[] = [
  {
    type: 'batch',
    name: 'Batch',
    line: 'Load it, close it, watch it.',
    eq: 'dS/dt = − q_{S} X',
    text: 'Substrate only falls. Growth is fast at first, then starves as the medium runs out.',
  },
  {
    type: 'fedbatch',
    name: 'Fed-batch',
    line: 'Feed the culture what it can use.',
    eq: 'dV/dt = F',
    text: 'Fresh substrate is pumped in and the volume rises, delaying depletion and reaching higher cell densities.',
  },
  {
    type: 'cstr',
    name: 'CSTR',
    line: 'Steady state, or washout.',
    eq: 'D_{crit} = μ(S_{f}) − k_{d}',
    text: 'Medium flows in and culture flows out. Below the critical dilution rate the culture stabilises; above it, it vanishes.',
  },
]

const FEATURED = ['healthy-batch', 'controlled-fedbatch', 'stable-cstr', 'cstr-washout']
  .map((id) => presetById(id))
  .filter((p): p is Preset => !!p)

export default function HomePage({ onLaunchReactor, onRunPreset }: HomePageProps) {
  return (
    <div>
      <Hero />

      {/* Stats ribbon */}
      <section aria-label="At a glance" className="border-y border-ink-600/60 bg-ink-900/50">
        <dl className="mx-auto grid max-w-[1360px] grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="border-l border-ink-600 pl-4">
                <dd className="font-display text-4xl font-semibold text-paper">
                  <CountUp to={s.to} />
                </dd>
                <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-aqua">{s.label}</dt>
                <dd className="mt-1 text-xs text-muted">{s.note}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Three reactor modes */}
      <section className="mx-auto max-w-[1360px] px-4 pt-24 sm:px-6" aria-labelledby="modes-h">
        <Reveal>
          <div className="eyebrow">Three ways to run a culture</div>
          <h2 id="modes-h" className="mt-2 max-w-3xl font-display text-3xl font-semibold sm:text-5xl">
            One organism. Three reactor designs. Very different outcomes.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {MODES.map((m, i) => (
            <Reveal key={m.type} delay={i * 100}>
              <article className="glass frame flex h-full flex-col p-6">
                <ReactorGlyph type={m.type} className="mb-4 h-28 w-36" />
                <h3 className="font-display text-2xl font-semibold">{m.name}</h3>
                <p className="mt-1 text-sm font-medium text-aqua">{m.line}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{m.text}</p>
                <div className="well mt-4 px-3 py-2 text-center text-lg text-paper">
                  <Eq>{m.eq}</Eq>
                </div>
                <div className="mt-auto pt-5">
                  <a
                    href={hrefFor('lab')}
                    onClick={() => onLaunchReactor(m.type)}
                    className="btn-ghost btn-sm"
                  >
                    Open {m.name} in the Lab →
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How the lab works */}
      <section className="mx-auto max-w-[1360px] px-4 pt-28 sm:px-6" aria-labelledby="how-h">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <div className="eyebrow">One trajectory, three views</div>
            <h2 id="how-h" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              The vessel, the numbers and the graphs are the same data.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Every run is computed once with a fourth-order Runge–Kutta solver and then played back. The liquid level, the turbidity of the culture, the metric cards and the charts all read from the same trajectory, so nothing on screen is decoration.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ['Fed-batch volume rises', 'you see the liquid level climb and the feed bottle empty.'],
                ['Biomass grows', 'the medium darkens and fills with cells.'],
                ['CSTR washes out', 'the vessel clears and a warning appears.'],
              ].map(([a, b]) => (
                <li key={a} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-paper">{a}: </span>
                    <span className="text-muted">{b}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a href={hrefFor('methodology')} className="mt-6 inline-block font-mono text-sm text-aqua hover:underline">
              Read the methodology →
            </a>
          </Reveal>
          <Reveal delay={120}>
            <MonodExplorer />
          </Reveal>
        </div>
      </section>

      {/* Experiments teaser */}
      <section className="mx-auto max-w-[1360px] px-4 pt-28 sm:px-6" aria-labelledby="exp-h">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Experiment gallery</div>
              <h2 id="exp-h" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                Start with a scenario
              </h2>
            </div>
            <a href={hrefFor('experiments')} className="btn-ghost btn-sm">
              All {PRESETS.length} experiments →
            </a>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURED.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ExperimentCard preset={p} compact onRun={(preset) => { onRunPreset(preset); window.location.hash = hrefFor('lab') }} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-[1360px] px-4 pt-28 sm:px-6" aria-labelledby="cta-h">
        <Reveal>
          <div className="glass frame relative overflow-hidden px-6 py-14 text-center sm:px-12">
            <div className="absolute inset-0 -z-10 opacity-60" style={{ background: 'radial-gradient(60% 90% at 50% 0%, rgba(70,224,200,0.18), transparent 70%)' }} aria-hidden="true" />
            <h2 id="cta-h" className="mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-5xl">
              Ready to run your first experiment?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">No installation and no sign-up. It runs entirely in your browser, and it is built to be projected in a classroom.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={hrefFor('lab')} className="btn-primary px-6 py-3 text-base">
                Enter the Bioreactor Lab
              </a>
              <a href={hrefFor('learn')} className="btn-ghost px-6 py-3 text-base">
                Explore the Science
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
