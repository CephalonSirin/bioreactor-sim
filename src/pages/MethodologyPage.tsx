import { useState } from 'react'
import { EquationBlock } from '../components/ui/Eq'
import { renderMath } from '../components/ui/mathText'
import Reveal from '../components/ui/Reveal'
import { ASSUMPTIONS, DERIVED_EQUATIONS, MASS_BALANCES, RATE_LAWS, REFERENCES, VARIABLES } from '../content/equations'
import type { VariableDef } from '../content/equations'
import type { ReactorType } from '../simulation/types'

const varBySymbol = new Map<string, VariableDef>(VARIABLES.map((v) => [v.symbol, v]))

function VarTable({ symbols }: { symbols: string[] }) {
  const rows = symbols.map((s) => varBySymbol.get(s)).filter((v): v is VariableDef => !!v)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-ink-600 font-mono text-[10px] uppercase tracking-wider text-dim">
            <th className="py-1.5 pr-3 font-normal">Symbol</th>
            <th className="py-1.5 pr-3 font-normal">Quantity</th>
            <th className="py-1.5 pr-3 font-normal">Unit</th>
            <th className="py-1.5 font-normal">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.symbol} className="border-b border-ink-700/60 align-top">
              <td className="math py-2 pr-3 text-base text-aqua">{renderMath(v.symbol)}</td>
              <td className="py-2 pr-3 text-paper">{v.name}</td>
              <td className="py-2 pr-3 font-mono text-xs text-muted">{v.unit}</td>
              <td className="py-2 text-muted">{renderMath(v.meaning)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Card({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section id={id} className="glass scroll-mt-24 p-5 sm:p-7" aria-labelledby={`${id}-h`}>
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={`${id}-h`} className="mb-4 mt-1 font-display text-2xl font-semibold">
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  )
}

const Meaning = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 border-l-2 border-ink-500 pl-3 text-sm leading-relaxed text-muted">
    <span className="font-mono text-[10px] uppercase tracking-wider text-aqua">Physical meaning </span>
    {children}
  </p>
)

const MODES: { id: ReactorType; label: string }[] = [
  { id: 'batch', label: 'Batch' },
  { id: 'fedbatch', label: 'Fed-batch' },
  { id: 'cstr', label: 'CSTR' },
]

const VISUAL_MAP: [string, string][] = [
  ['Liquid level', 'Working volume V (fed-batch rises; batch and CSTR constant)'],
  ['Liquid colour and amber cells', 'Biomass X, on the absolute scale 1 − e^(−X/3) so a dilute culture stays clear'],
  ['Teal dots', 'Substrate S, relative to its peak in the run'],
  ['Coral dots', 'Product P, relative to its peak in the run'],
  ['Extra bubbles', 'Growth activity μX, relative to its peak (metabolic gas). A baseline of aeration bubbles is always drawn'],
  ['Feed and outflow lines', 'Feed flow F (fed-batch) or D·V (CSTR); their speed and thickness scale with the flow'],
  ['Feed bottle level', 'Fed volume so far, V − V₀'],
  ['“Washout” badge', 'Biomass below 5% of its peak after the peak, in a CSTR'],
]

export default function MethodologyPage() {
  const [mode, setMode] = useState<ReactorType>('batch')
  const set = MASS_BALANCES[mode]

  return (
    <div className="mx-auto max-w-[980px] px-4 pb-8 pt-10 sm:px-6">
      <header className="mb-8">
        <div className="eyebrow">About · Methodology</div>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">How the model works</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Everything on this site is computed from the equations on this page. The notation, units and assumptions below match the code that runs the simulation.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Model scope">
          {['Educational', 'Simplified', 'Deterministic', 'Idealised mass balances', 'Single limiting substrate', 'Not an industrial process simulator'].map((t) => (
            <li key={t} className="rounded-full border border-aqua/40 bg-aqua/5 px-3 py-1 font-mono text-[11px] text-aqua">
              {t}
            </li>
          ))}
        </ul>
      </header>

      <div className="flex flex-col gap-6">
        <Card id="state" eyebrow="1 · State variables" title="What is being simulated">
          <p className="mb-3 text-[15px] leading-relaxed text-paper/90">
            At every instant the reactor is described by four numbers: biomass <em>X</em>, substrate <em>S</em>, product <em>P</em> and volume <em>V</em>. Each reactor mode gives one differential equation per variable, a mass balance, and the solver advances them together through time.
          </p>
          <VarTable symbols={['X', 'S', 'P', 'V']} />
        </Card>

        <Card id="rates" eyebrow="2 · Rate laws" title="Growth, product formation and substrate uptake">
          <h3 className="mb-1 font-display text-lg font-semibold">Monod growth</h3>
          <EquationBlock lines={[RATE_LAWS.monod]} accent="#9fd18a" label="Monod equation" />
          <VarTable symbols={['μ', 'μ_{max}', 'K_{s}', 'S']} />
          <Meaning>
            {renderMath(
              'Growth is limited by the amount of substrate available, and saturates at μ_{max} because the cell’s uptake machinery has a finite capacity. At S = K_{s}, the culture grows at half its maximum rate.'
            )}
          </Meaning>

          <h3 className="mb-1 mt-8 font-display text-lg font-semibold">Luedeking–Piret product formation</h3>
          <EquationBlock lines={[RATE_LAWS.product]} accent="#f0805f" label="Luedeking-Piret equation" />
          <VarTable symbols={['q_{p}', 'α', 'β', 'μ']} />
          <Meaning>Product forms partly in proportion to growth (α μ) and partly in proportion to biomass regardless of growth (β), covering primary and secondary metabolites.</Meaning>

          <h3 className="mb-1 mt-8 font-display text-lg font-semibold">Substrate uptake</h3>
          <EquationBlock lines={[RATE_LAWS.uptake]} accent="#46e0c8" label="Substrate uptake" />
          <VarTable symbols={['q_{S}', 'Y_{x/s}', 'Y_{p/s}', 'm_{s}']} />
          <Meaning>
            Substrate is spent on three things: building biomass, making product, and keeping cells alive. The sum, per gram of biomass per hour, drives the substrate balance in every reactor mode.
          </Meaning>
        </Card>

        <Card id="balances" eyebrow="3 · Mass balances" title="One set of equations per reactor mode">
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Reactor mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  mode === m.id ? 'border-aqua bg-aqua/15 text-aqua' : 'border-ink-500 text-muted hover:border-aqua/60 hover:text-paper'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <h3 className="font-display text-lg font-semibold">{set.title}</h3>
          <p className="text-sm text-muted">{set.summary}</p>
          <EquationBlock lines={set.lines} label={`${set.title} mass balances`} />
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
            {set.meaning.map((m, i) => (
              <li key={i}>{renderMath(m)}</li>
            ))}
          </ul>
          <div className="mt-4">
            <VarTable symbols={mode === 'batch' ? ['k_{d}'] : mode === 'fedbatch' ? ['F', 'D', 'S_{f}', 'k_{d}'] : ['D', 'S_{f}', 'k_{d}']} />
          </div>
        </Card>

        <Card id="derived" eyebrow="4 · Derived results" title="Washout, steady state, yield and productivity">
          <div className="flex flex-col gap-6">
            {DERIVED_EQUATIONS.map((d) => (
              <div key={d.id}>
                <h3 className="font-display text-lg font-semibold">{d.title}</h3>
                <EquationBlock lines={d.lines} accent="#8fa6e8" label={d.title} />
                <Meaning>{renderMath(d.meaning)}</Meaning>
              </div>
            ))}
          </div>
        </Card>

        <Card id="numerics" eyebrow="5 · Numerical method" title="Fourth-order Runge–Kutta integration">
          <p className="mb-2 text-[15px] leading-relaxed text-paper/90">
            The four balances form a system of ordinary differential equations dy/dt = f(y) with y = (X, S, P, V). They are integrated with the classical fourth-order Runge–Kutta method, which is accurate for the nonlinear Monod term without needing tiny time steps.
          </p>
          <EquationBlock
            lines={[
              'y_{n+1} = y_{n} + (Δt / 6)(k_{1} + 2 k_{2} + 2 k_{3} + k_{4})',
              'k_{1} = f(y_{n}),  k_{2} = f(y_{n} + Δt k_{1} / 2)',
              'k_{3} = f(y_{n} + Δt k_{2} / 2),  k_{4} = f(y_{n} + Δt k_{3})',
            ]}
            label="Runge-Kutta 4"
          />
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
            <li>The whole trajectory is computed up front and then played back, so playback speed and frame rate never change the numbers.</li>
            <li>Concentrations and volume are kept non-negative after each step, and substrate is clamped at zero inside the rate laws.</li>
            <li>Every step is checked for NaN or infinite values; if one appears the run stops with an explanation instead of drawing bad data.</li>
            <li>Inputs are validated, sliders are range-limited, and the Lab warns when a time step is coarse or a CSTR is at or above D_crit.</li>
            <li>Check: with the Stable CSTR experiment the simulation converges to the analytical steady state X*, S*, P* shown above.</li>
          </ul>
        </Card>

        <Card id="visuals" eyebrow="6 · Reading the animation" title="What each visual element shows">
          <p className="mb-3 text-sm leading-relaxed text-muted">
            The reactor drawing is not decoration: each element is driven by the simulated state at the current playback time. Its geometry is schematic and not to scale, and the impeller speed is a fixed operating setting.
          </p>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,220px)_1fr]">
            {VISUAL_MAP.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-medium text-aqua">{k}</dt>
                <dd className="mb-2 text-muted sm:mb-0">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card id="assumptions" eyebrow="7 · Scope" title="Assumptions and limitations">
          <ul className="flex flex-col gap-2">
            {ASSUMPTIONS.map((a) => (
              <li key={a} className="flex gap-2.5 text-[15px] leading-relaxed text-paper/90">
                <span className="mt-2.5 h-1 w-3 shrink-0 rounded-full bg-aqua" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Card>

        <Card id="symbols" eyebrow="8 · Reference" title="Full symbol table">
          <VarTable symbols={VARIABLES.map((v) => v.symbol)} />
        </Card>

        <Card id="references" eyebrow="9 · Further reading" title="References">
          <ul className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {REFERENCES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
