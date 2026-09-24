import { useEffect, useState } from 'react'
import { EquationBlock } from '../components/ui/Eq'
import { renderMath } from '../components/ui/mathText'
import Segmented from '../components/ui/Segmented'
import { ASSUMPTIONS, DERIVED_EQUATIONS, MASS_BALANCES, RATE_LAWS, REFERENCES, VARIABLES } from '../content/equations'
import type { VariableDef } from '../content/equations'
import type { ReactorType } from '../simulation/types'

const varBySymbol = new Map<string, VariableDef>(VARIABLES.map((v) => [v.symbol, v]))

function VarTable({ symbols }: { symbols: string[] }) {
  const rows = symbols.map((s) => varBySymbol.get(s)).filter((v): v is VariableDef => !!v)
  return (
    <div className="my-5 overflow-x-auto">
      <table className="data-table min-w-[560px]">
        <thead>
          <tr>
            <th scope="col" className="w-20">Symbol</th>
            <th scope="col" className="w-[30%]">Quantity</th>
            <th scope="col" className="w-28">Unit</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.symbol}>
              <td className="math text-[1.05rem] text-ink">{renderMath(v.symbol)}</td>
              <td className="text-ink">{v.name}</td>
              <td className="font-mono text-label text-ink-2">{v.unit}</td>
              <td className="text-ink-2">{renderMath(v.meaning)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SECTIONS = [
  { id: 'state', title: 'State variables' },
  { id: 'rates', title: 'Rate laws' },
  { id: 'balances', title: 'Mass balances' },
  { id: 'derived', title: 'Derived results' },
  { id: 'numerics', title: 'Numerical method' },
  { id: 'visuals', title: 'Reading the vessel' },
  { id: 'assumptions', title: 'Assumptions and limits' },
  { id: 'symbols', title: 'Symbol table' },
  { id: 'references', title: 'References' },
]

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-[calc(var(--nav-h)+24px)] border-b border-line py-12 first:pt-2 last:border-b-0">
      <h2 id={`${id}-h`} className="t-section mb-5 flex items-baseline gap-4">
        <span className="num font-mono text-label font-normal text-ink-4">§{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

const Meaning = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 max-w-prose border-l border-line-strong pl-4 text-ui leading-relaxed text-ink-2">
    <span className="font-medium text-ink">Physical meaning. </span>
    {children}
  </p>
)

const Sub = ({ children }: { children: React.ReactNode }) => <h3 className="t-sub mb-1 mt-10 first:mt-0">{children}</h3>

const MODES: { value: ReactorType; label: string }[] = [
  { value: 'batch', label: 'Batch' },
  { value: 'fedbatch', label: 'Fed-batch' },
  { value: 'cstr', label: 'CSTR' },
]

const VISUAL_MAP: [string, string][] = [
  ['Liquid level', 'Working volume V. Rises in fed-batch; constant in batch and CSTR.'],
  ['Broth colour and ochre particles', 'Biomass X on the absolute scale 1 − e^(−X/3), so a dilute culture stays clear. Particle density is a cue, not a cell count.'],
  ['Blue dots', 'Substrate S, relative to its peak in the run.'],
  ['Rings', 'Product P, relative to its peak in the run.'],
  ['Bubbles', 'Illustrative only: a constant aeration rate plus extra gas scaled by growth activity μX. Oxygen transfer is not modelled.'],
  ['Probes and head plate', 'Context only. pH, dissolved oxygen and temperature are not simulated.'],
  ['Feed and effluent lines', 'Feed flow F (fed-batch) or D·V (CSTR). Pump speed and pulses follow the flow.'],
  ['Feed and harvest bottles', 'Fed volume so far (V − V₀), or medium used and effluent collected in a CSTR.'],
  ['Washout notice', 'Shown when biomass falls below 5% of its peak after the peak, in a CSTR.'],
]

const SCOPE = ['Educational', 'Simplified', 'Deterministic', 'Ideal mixing', 'Single limiting substrate', 'Not an industrial process model']

export default function MethodologyPage() {
  const [mode, setMode] = useState<ReactorType>('batch')
  const [active, setActive] = useState('state')
  const set = MASS_BALANCES[mode]

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <div className="mx-auto max-w-page px-4 pb-10 pt-12 sm:px-6 lg:pt-16">
      <header className="border-b border-ink pb-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <h1 className="t-page max-w-[14ch]">Methodology</h1>
          <p className="max-w-prose text-body text-ink-2">
            Everything on this site is computed from the equations below. Notation, units and assumptions match the code in <code className="font-mono text-ui text-ink">src/simulation/</code>.
          </p>
        </div>
        <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-label text-ink-3">
          <span className="font-medium text-ink-2">Scope</span>
          {SCOPE.map((t, i) => (
            <span key={t} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true">·</span>}
              {t}
            </span>
          ))}
        </p>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="sticky top-[calc(var(--nav-h)+32px)]">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#/methodology`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  aria-current={active === s.id ? 'location' : undefined}
                  className={`flex items-baseline gap-3 border-l py-1.5 pl-4 text-ui transition-colors duration-200 ${active === s.id ? 'border-ink font-medium text-ink' : 'border-line text-ink-3 hover:text-ink'}`}
                >
                  <span className="num w-5 font-mono text-micro font-normal text-ink-4">§{i + 1}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 max-w-[860px]">
          <Section n={1} id="state" title="State variables">
            <p className="max-w-prose text-body leading-[1.7] text-ink-2">
              At every instant the reactor is described by four numbers: biomass <span className="math">X</span>, substrate <span className="math">S</span>, product <span className="math">P</span> and volume <span className="math">V</span>. Each reactor mode gives one differential equation per variable, a mass balance, and the solver advances them together.
            </p>
            <VarTable symbols={['X', 'S', 'P', 'V']} />
          </Section>

          <Section n={2} id="rates" title="Rate laws">
            <Sub>Monod growth</Sub>
            <EquationBlock lines={[RATE_LAWS.monod]} number={1} label="Monod equation" />
            <VarTable symbols={['μ', 'μ_{max}', 'K_{s}', 'S']} />
            <Meaning>
              {renderMath(
                'Growth is limited by the substrate available and saturates at μ_{max}, because the uptake machinery has a finite capacity. At S = K_{s} the culture grows at half its maximum rate.'
              )}
            </Meaning>

            <Sub>Luedeking–Piret product formation</Sub>
            <EquationBlock lines={[RATE_LAWS.product]} number={2} label="Luedeking-Piret equation" />
            <VarTable symbols={['q_{p}', 'α', 'β', 'μ']} />
            <Meaning>Product forms partly in proportion to growth (α μ) and partly in proportion to biomass regardless of growth (β), covering primary and secondary metabolites.</Meaning>

            <Sub>Substrate uptake</Sub>
            <EquationBlock lines={[RATE_LAWS.uptake]} number={3} label="Substrate uptake" />
            <VarTable symbols={['q_{S}', 'Y_{x/s}', 'Y_{p/s}', 'm_{s}']} />
            <Meaning>Substrate is spent on three things: building biomass, making product and keeping cells alive. Their sum, per gram of biomass per hour, drives the substrate balance in every mode.</Meaning>
          </Section>

          <Section n={3} id="balances" title="Mass balances">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-ui text-ink-2">{set.summary}</p>
              <Segmented value={mode} options={MODES} onChange={setMode} label="Reactor mode" />
            </div>
            <div key={mode} className="pop-in">
              <EquationBlock lines={set.lines} number={mode === 'fedbatch' ? '4a–e' : '4a–d'} label={`${set.title} mass balances`} />
              <ul className="max-w-prose space-y-2 text-ui leading-relaxed text-ink-2">
                {set.meaning.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[9px] h-px w-3 shrink-0 bg-ink-3" aria-hidden="true" />
                    <span>{renderMath(m)}</span>
                  </li>
                ))}
              </ul>
              <VarTable symbols={mode === 'batch' ? ['k_{d}'] : mode === 'fedbatch' ? ['F', 'D', 'S_{f}', 'k_{d}'] : ['D', 'S_{f}', 'k_{d}']} />
            </div>
          </Section>

          <Section n={4} id="derived" title="Derived results">
            {DERIVED_EQUATIONS.map((d, i) => (
              <div key={d.id}>
                <Sub>{d.title}</Sub>
                <EquationBlock lines={d.lines} number={5 + i} label={d.title} />
                <Meaning>{renderMath(d.meaning)}</Meaning>
              </div>
            ))}
          </Section>

          <Section n={5} id="numerics" title="Numerical method">
            <p className="max-w-prose text-body leading-[1.7] text-ink-2">
              The four balances form a system of ordinary differential equations <span className="math">dy/dt = f(y)</span> with <span className="math">y = (X, S, P, V)</span>. They are integrated with the classical fourth-order Runge–Kutta method, accurate for the nonlinear Monod term without tiny steps.
            </p>
            <EquationBlock
              lines={['y_{n+1} = y_{n} + (Δt / 6)(k_{1} + 2 k_{2} + 2 k_{3} + k_{4})', 'k_{1} = f(y_{n}),  k_{2} = f(y_{n} + Δt k_{1} / 2)', 'k_{3} = f(y_{n} + Δt k_{2} / 2),  k_{4} = f(y_{n} + Δt k_{3})']}
              number={8}
              label="Runge-Kutta 4"
            />
            <ul className="max-w-prose space-y-2 text-ui leading-relaxed text-ink-2">
              {[
                'The whole trajectory is computed once and then played back, so playback speed and frame rate never change the numbers.',
                'Concentrations and volume are kept non-negative after each step, and substrate is clamped at zero inside the rate laws.',
                'Every step is checked for NaN or infinite values; if one appears the run stops with an explanation instead of drawing bad data.',
                'Inputs are range-limited, and the Lab warns when a time step is coarse or a CSTR is at or above D_crit.',
                'Check: the Stable CSTR experiment converges to the analytical steady state X*, S*, P* of equation (6).',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-[9px] h-px w-3 shrink-0 bg-ink-3" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section n={6} id="visuals" title="Reading the vessel">
            <p className="max-w-prose text-body leading-[1.7] text-ink-2">
              Each element of the 3D vessel is driven by the simulated state at the playback time, except where marked illustrative. Geometry is schematic and not to scale, and the impeller speed is a fixed operating setting.
            </p>
            <dl className="mt-6 border-t border-line">
              {VISUAL_MAP.map(([k, v]) => (
                <div key={k} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[220px_1fr] sm:gap-6">
                  <dt className="text-ui font-medium text-ink">{k}</dt>
                  <dd className="text-ui text-ink-2">{renderMath(v)}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section n={7} id="assumptions" title="Assumptions and limits">
            <ol className="max-w-prose space-y-3">
              {ASSUMPTIONS.map((a, i) => (
                <li key={a} className="grid grid-cols-[2rem_1fr] text-body leading-relaxed text-ink-2">
                  <span className="num pt-[3px] font-mono text-label text-ink-4">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section n={8} id="symbols" title="Symbol table">
            <VarTable symbols={VARIABLES.map((v) => v.symbol)} />
          </Section>

          <Section n={9} id="references" title="References">
            <ol className="max-w-prose space-y-3">
              {REFERENCES.map((r, i) => (
                <li key={r} className="grid grid-cols-[2rem_1fr] text-ui leading-relaxed text-ink-2">
                  <span className="num font-mono text-label text-ink-4">[{i + 1}]</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  )
}
