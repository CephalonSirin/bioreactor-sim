import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Hero from '../components/home/Hero'
import Reveal from '../components/ui/Reveal'
import ReactorGlyph from '../components/viz/ReactorGlyph'
import { MonodExplorer } from '../components/learn/Interactives'
import { Eq } from '../components/ui/Eq'
import { hrefFor, navigate } from '../hooks/useHashRoute'
import { PRESETS } from '../simulation/presets'
import type { Preset } from '../simulation/presets'
import type { ReactorType, SimPoint } from '../simulation/types'
import { getPresetPreview } from '../lib/presetPreview'
import { SERIES } from '../lib/palette'
import { EXPERIMENT_CODE } from '../content/experiments'

interface HomePageProps {
  onLaunchReactor: (type: ReactorType) => void
  onRunPreset: (preset: Preset) => void
}

function MiniFigure({ points, className = '', label }: { points: SimPoint[]; className?: string; label: string }) {
  const d = useMemo(() => {
    const W = 200
    const H = 64
    const tMax = points[points.length - 1]?.t || 1
    const line = (key: 'X' | 'S' | 'P') => {
      const max = Math.max(...points.map((p) => Math.max(p.X, p.S, p.P)), 1e-9)
      return points.map((p, i) => `${i ? 'L' : 'M'}${((p.t / tMax) * W).toFixed(1)} ${(H - 3 - (p[key] / max) * (H - 8)).toFixed(1)}`).join(' ')
    }
    return { W, H, X: line('X'), S: line('S'), P: line('P') }
  }, [points])
  return (
    <svg viewBox={`0 0 ${d.W} ${d.H}`} className={className} role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="0" x2={d.W} y1={d.H - 0.5} y2={d.H - 0.5} stroke="#CBCBC5" vectorEffect="non-scaling-stroke" />
      <path d={d.S} fill="none" stroke={SERIES.S} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={d.P} fill="none" stroke={SERIES.P} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={d.X} fill="none" stroke={SERIES.X} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const MODES: { type: ReactorType; name: string; inflow: string; outflow: string; volume: string; behaviour: string; eq: string }[] = [
  { type: 'batch', name: 'Batch', inflow: 'None', outflow: 'None', volume: 'Constant', behaviour: 'Grows until the substrate runs out, then stops.', eq: 'dS/dt = − q_{S} X' },
  { type: 'fedbatch', name: 'Fed-batch', inflow: 'Feed at F', outflow: 'None', volume: 'Rises at F', behaviour: 'Feeding delays depletion and reaches higher cell mass.', eq: 'dV/dt = F' },
  { type: 'cstr', name: 'CSTR', inflow: 'Feed at D·V', outflow: 'Culture at D·V', volume: 'Constant', behaviour: 'Settles to a steady state, or washes out above D_{crit}.', eq: 'μ* = D + k_{d}' },
]

export default function HomePage({ onLaunchReactor, onRunPreset }: HomePageProps) {
  const healthy = getPresetPreview(PRESETS[0])

  const open = (type: ReactorType) => {
    onLaunchReactor(type)
    navigate('lab')
  }
  const run = (p: Preset) => {
    onRunPreset(p)
    navigate('lab')
  }

  return (
    <div>
      <Hero />

      {/* Process -> model -> experiment -> results */}
      <section className="mx-auto max-w-page px-4 pt-24 sm:px-6 lg:pt-32" aria-labelledby="flow-h">
        <Reveal className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <h2 id="flow-h" className="t-section max-w-[18ch]">
            From a vessel to a figure, in four steps you can inspect.
          </h2>
          <p className="max-w-prose text-body text-ink-2 lg:justify-self-end">
            Every run follows the same path. Nothing on screen is an animation for its own sake: the vessel, the numbers and the charts are all read from the trajectory the solver writes.
          </p>
        </Reveal>

        <ol className="mt-14 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
          <Reveal as="li" className="flex flex-col border-b border-line py-7 sm:pr-8 lg:border-b-0 lg:border-r">
            <div className="flex h-24 items-end gap-3 text-ink-2">
              {(['batch', 'fedbatch', 'cstr'] as ReactorType[]).map((t) => (
                <ReactorGlyph key={t} type={t} className="h-16 w-20" title={`${t} schematic`} />
              ))}
            </div>
            <h3 className="t-sub mt-6">
              Process
              <span className="block text-ui font-normal text-ink-3">Choose a configuration</span>
            </h3>
            <p className="mt-2 text-ui leading-relaxed text-ink-3">Batch, fed-batch or continuous. The choice decides what crosses the vessel boundary.</p>
          </Reveal>
          <Reveal as="li" delay={70} className="flex flex-col border-b border-line py-7 sm:pl-8 lg:border-b-0 lg:border-r lg:px-8">
            <div className="flex h-24 flex-col justify-end gap-1 text-ink">
              <Eq className="text-[1.2rem]">{'μ = μ_{max} S / (K_{s} + S)'}</Eq>
              <Eq className="text-[1.2rem]">{'dX/dt = (μ − k_{d} − D) X'}</Eq>
            </div>
            <h3 className="t-sub mt-6">
              Model
              <span className="block text-ui font-normal text-ink-3">Write the balances</span>
            </h3>
            <p className="mt-2 text-ui leading-relaxed text-ink-3">Monod growth, Luedeking–Piret product formation and one mass balance per state variable.</p>
          </Reveal>
          <Reveal as="li" delay={140} className="flex flex-col border-b border-line py-7 sm:pr-8 lg:border-b-0 lg:border-r lg:px-8">
            <dl className="grid h-24 grid-cols-[auto_1fr] content-end gap-x-4 gap-y-1 font-mono text-label">
              {[
                ['μmax', '0.40 h⁻¹'],
                ['Ks', '0.50 g/L'],
                ['S₀', '10.0 g/L'],
                ['X₀', '0.10 g/L'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="num text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="t-sub mt-6">
              Experiment
              <span className="block text-ui font-normal text-ink-3">Set the conditions</span>
            </h3>
            <p className="mt-2 text-ui leading-relaxed text-ink-3">Kinetic constants, initial state, feed and run length, each with its unit and range.</p>
          </Reveal>
          <Reveal as="li" delay={210} className="flex flex-col py-7 sm:pl-8 lg:pl-8">
            <div className="flex h-24 items-end">{healthy && <MiniFigure points={healthy.points} className="h-20 w-full" label="Biomass, substrate and product of the default batch run" />}</div>
            <h3 className="t-sub mt-6">
              Results
              <span className="block text-ui font-normal text-ink-3">Read the trajectory</span>
            </h3>
            <p className="mt-2 text-ui leading-relaxed text-ink-3">RK4 integrates the run once; playback, figures and exports all read the same result.</p>
          </Reveal>
        </ol>
      </section>

      {/* Three configurations */}
      <section className="mx-auto max-w-page px-4 pt-24 sm:px-6 lg:pt-32" aria-labelledby="modes-h">
        <Reveal className="max-w-2xl">
          <h2 id="modes-h" className="t-section">
            Same organism, three reactors, three different outcomes.
          </h2>
          <p className="mt-4 text-body text-ink-2">The kinetics never change between modes. Only the terms for flow and volume do, and that is enough to decide whether a culture starves, keeps growing or settles.</p>
        </Reveal>
        <Reveal className="mt-10 border-t border-ink md:hidden">
          <ul>
            {MODES.map((m) => (
              <li key={m.type} className="border-b border-line py-5">
                <button type="button" onClick={() => open(m.type)} className="flex w-full items-center gap-4 text-left">
                  <ReactorGlyph type={m.type} className="h-12 w-16 shrink-0 text-ink-2" />
                  <span className="flex-1 text-[17px] font-semibold text-ink">{m.name}</span>
                  <ArrowUpRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
                </button>
                <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-y-1 text-ui">
                  <dt className="text-ink-3">In</dt>
                  <dd className="text-ink-2">{m.inflow}</dd>
                  <dt className="text-ink-3">Out</dt>
                  <dd className="text-ink-2">{m.outflow}</dd>
                  <dt className="text-ink-3">Volume</dt>
                  <dd className="text-ink-2">{m.volume}</dd>
                </dl>
                <p className="mt-2 text-ui text-ink-2">
                  <Eq className="!not-italic !font-sans">{m.behaviour}</Eq>
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="mt-10 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink text-label text-ink-3">
                <th scope="col" className="w-[26%] pb-3 font-medium">Configuration</th>
                <th scope="col" className="pb-3 font-medium">In</th>
                <th scope="col" className="pb-3 font-medium">Out</th>
                <th scope="col" className="pb-3 font-medium">Volume</th>
                <th scope="col" className="w-[28%] pb-3 font-medium">Typical behaviour</th>
                <th scope="col" className="pb-3 font-medium">Defining relation</th>
                <th scope="col" className="pb-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((m) => (
                <tr key={m.type} className="group border-b border-line align-middle transition-colors duration-150 hover:bg-surface">
                  <th scope="row" className="py-5 pr-4 font-normal">
                    <button type="button" onClick={() => open(m.type)} className="flex items-center gap-4 text-left">
                      <ReactorGlyph type={m.type} className="h-12 w-16 shrink-0 text-ink-2 transition-colors group-hover:text-ink" />
                      <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{m.name}</span>
                    </button>
                  </th>
                  <td className="py-5 pr-4 text-ui text-ink-2">{m.inflow}</td>
                  <td className="py-5 pr-4 text-ui text-ink-2">{m.outflow}</td>
                  <td className="py-5 pr-4 text-ui text-ink-2">{m.volume}</td>
                  <td className="py-5 pr-4 text-ui text-ink-2">
                    <Eq className="!not-italic !font-sans">{m.behaviour}</Eq>
                  </td>
                  <td className="py-5 pr-4 text-[1.1rem] text-ink">
                    <Eq>{m.eq}</Eq>
                  </td>
                  <td className="py-5 text-right">
                    <button type="button" onClick={() => open(m.type)} className="btn-ghost btn-sm text-ink-2" aria-label={`Open ${m.name} in the Lab`}>
                      Open
                      <ArrowUpRight className="!h-3.5 !w-3.5 transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* The Monod curve, live */}
      <section className="mx-auto max-w-page px-4 pt-24 sm:px-6 lg:pt-32" aria-labelledby="monod-h">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Reveal>
            <h2 id="monod-h" className="t-section max-w-[16ch]">
              Growth depends on food, until it doesn’t.
            </h2>
            <div className="prose-body mt-5 max-w-prose">
              <p>
                At low substrate the culture grows slowly; as substrate rises, growth speeds up and then saturates at a maximum set by the organism. Jacques Monod described it this way in 1949, and it is the growth law every run here uses.
              </p>
              <p>Move the sliders to see how the two constants shape the curve.</p>
            </div>
            <a href={hrefFor('learn', 'monod')} className="link mt-6 inline-flex items-center gap-1 text-ui">
              Monod kinetics in Learn <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Reveal>
          <Reveal delay={80}>
            <MonodExplorer />
          </Reveal>
        </div>
      </section>

      {/* Experiment index */}
      <section className="mx-auto max-w-page px-4 pt-24 sm:px-6 lg:pt-32" aria-labelledby="exp-h">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="exp-h" className="t-section">
            Eight prepared experiments
          </h2>
          <a href={hrefFor('experiments')} className="link inline-flex items-center gap-1 text-ui">
            Experiment archive <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Reveal>
        <Reveal as="div" className="mt-8 border-t border-ink">
          <ul className="grid sm:grid-cols-2">
            {PRESETS.map((p, i) => {
              const prev = getPresetPreview(p)
              return (
                <li key={p.id} className={`border-b border-line ${i % 2 === 0 ? 'sm:border-r sm:pr-6' : 'sm:pl-6'}`}>
                  <button type="button" onClick={() => run(p)} className="group grid w-full grid-cols-[3rem_1fr_7rem] items-center gap-4 py-4 text-left">
                    <span className="num font-mono text-label text-ink-3">{EXPERIMENT_CODE[p.id]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-ink">{p.label}</span>
                      <span className="block truncate text-label text-ink-3">{p.description}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {prev && <MiniFigure points={prev.points} className="h-8 w-full opacity-80 transition-opacity group-hover:opacity-100" label={`Preview of ${p.label}`} />}
                      <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-ink-3 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </section>

      {/* Scope */}
      <section className="mx-auto max-w-page px-4 pt-24 sm:px-6 lg:pt-32" aria-labelledby="scope-h">
        <Reveal className="grid gap-10 border-t border-ink pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 id="scope-h" className="t-section">
              What the model is, and is not.
            </h2>
            <p className="mt-4 text-ui leading-relaxed text-ink-3">A teaching model: deterministic, perfectly mixed, one limiting substrate. The full list of assumptions is in the methodology.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={hrefFor('lab')} className="btn-primary">
                Open the Lab
              </a>
              <a href={hrefFor('methodology')} className="btn-secondary">
                Methodology
              </a>
            </div>
          </div>
          <div>
            <h3 className="t-label mb-3 text-ink-2">Simulated</h3>
            <ul className="space-y-2 text-ui text-ink-2">
              {['Biomass, substrate, product and volume', 'Monod growth with maintenance and death', 'Luedeking–Piret product formation', 'Feed, dilution and washout', 'Analytical CSTR steady state as a check'].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-[9px] h-px w-3 shrink-0 bg-ink" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="t-label mb-3 text-ink-2">Not simulated</h3>
            <ul className="space-y-2 text-ui text-ink-3">
              {['Oxygen transfer and dissolved oxygen', 'pH, temperature and CO₂', 'Substrate or product inhibition', 'Lag phase and cell-to-cell variation', 'Mixing gradients and shear'].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-[9px] h-px w-3 shrink-0 bg-ink-4" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
