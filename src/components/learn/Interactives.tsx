import { useMemo, useState } from 'react'
import LineSvg, { Range } from './LineSvg'
import ReactorGlyph from '../viz/ReactorGlyph'
import ReactorViz from '../viz/ReactorViz'
import { BASE_KINETICS, defaultConfigFor } from '../../simulation/presets'
import { runSimulation } from '../../simulation/integrator'
import { criticalDilutionRate, cstrSteadyState, specificGrowthRate, specificProductionRate } from '../../simulation/kinetics'
import { mixColor } from '../../lib/format'
import { INK, SERIES } from '../../lib/palette'
import type { ReactorType } from '../../simulation/types'

/** An interactive figure: a quiet frame with a caption, the controls and the plot. */
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <figure className="my-6 rounded-lg border border-line bg-surface p-5">
    <figcaption className="mb-4 flex items-baseline justify-between gap-3">
      <span className="text-ui font-semibold text-ink">{title}</span>
      <span className="text-micro text-ink-3">Interactive</span>
    </figcaption>
    {children}
  </figure>
)

const linspace = (max: number, n = 80) => Array.from({ length: n + 1 }, (_, i) => (max * i) / n)

export function MonodExplorer() {
  const [muMax, setMuMax] = useState(0.4)
  const [Ks, setKs] = useState(0.5)
  const [S, setS] = useState(2)
  const k = { ...BASE_KINETICS, muMax, Ks }
  const points = useMemo(() => linspace(20).map((s) => [s, specificGrowthRate(s, k)] as [number, number]), [muMax, Ks]) // eslint-disable-line react-hooks/exhaustive-deps
  const mu = specificGrowthRate(S, k)
  return (
    <Panel title="Monod curve">
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-3">
          <Range label="Max growth rate μmax" value={muMax} min={0.1} max={1.5} step={0.05} unit="h⁻¹" onChange={setMuMax} color={SERIES.mu} />
          <Range label="Half-saturation constant Ks" value={Ks} min={0.05} max={5} step={0.05} unit="g/L" onChange={setKs} />
          <Range label="Substrate concentration S" value={S} min={0} max={20} step={0.1} unit="g/L" onChange={setS} color={SERIES.X} />
          <p className="rounded-md bg-canvas px-3 py-2.5 font-mono text-label leading-relaxed text-ink-2" aria-live="polite">
            At S = {S.toFixed(1)} g/L, μ = <span className="font-medium text-ink">{mu.toFixed(3)} h⁻¹</span> ({((mu / muMax) * 100).toFixed(0)}% of μmax). Doubling time ≈{' '}
            {mu > 0.001 ? `${(Math.LN2 / mu).toFixed(1)} h` : '∞'}.
          </p>
        </div>
        <LineSvg
          series={[{ points, color: SERIES.mu }]}
          xMax={20}
          yMax={Math.ceil(muMax * 1.3 * 10) / 10}
          xLabel="Substrate S (g/L)"
          yLabel="μ (1/h)"
          hLines={[{ y: muMax, label: 'μmax', color: SERIES.mu }, { y: muMax / 2, label: 'μmax / 2', color: INK[3] }]}
          vLines={[{ x: Ks, label: 'Ks', color: SERIES.S }]}
          markers={[{ x: S, y: mu, color: SERIES.X }]}
          ariaLabel="Monod curve of specific growth rate against substrate concentration"
        />
      </div>
    </Panel>
  )
}

export function ProductExplorer() {
  const [alpha, setAlpha] = useState(0.1)
  const [beta, setBeta] = useState(0.02)
  const k = { ...BASE_KINETICS, alpha, beta }
  const points = linspace(0.5, 40).map((mu) => [mu, specificProductionRate(mu, k)] as [number, number])
  const kind = alpha > 0 && beta > 0 ? 'mixed' : alpha > 0 ? 'growth-associated' : beta > 0 ? 'non-growth-associated' : 'no product'
  return (
    <Panel title="Luedeking–Piret product formation">
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-3">
          <Range label="Growth-associated α" value={alpha} min={0} max={1} step={0.01} unit="g/g" onChange={setAlpha} color={SERIES.P} />
          <Range label="Non-growth-associated β" value={beta} min={0} max={0.2} step={0.005} unit="g/g/h" onChange={setBeta} color={SERIES.P} />
          <p className="rounded-md bg-canvas px-3 py-2.5 text-label leading-relaxed text-ink-2" aria-live="polite">
            Product formation is <span className="font-medium text-ink">{kind}</span>.{' '}
            {alpha > 0 && beta === 0 && 'Product only appears while cells grow, as with many primary metabolites.'}
            {alpha === 0 && beta > 0 && 'Product keeps forming at a constant rate per cell even when growth stops, as with many secondary metabolites.'}
            {alpha > 0 && beta > 0 && 'Product forms both while growing and (at a lower rate) in stationary phase.'}
          </p>
        </div>
        <LineSvg
          series={[{ points, color: SERIES.P }]}
          xMax={0.5}
          yMax={Math.max(0.1, (alpha * 0.5 + beta) * 1.15)}
          xLabel="Growth rate μ (1/h)"
          yLabel="qp (g/g/h)"
          hLines={[{ y: beta, label: 'β (intercept)', color: INK[3] }]}
          ariaLabel="Specific product formation rate against growth rate"
        />
      </div>
    </Panel>
  )
}

export function YieldExplorer() {
  const [Yxs, setYxs] = useState(0.5)
  return (
    <Panel title="Where does 1 g of substrate go?">
      <Range label="Biomass yield Yx/s" value={Yxs} min={0.05} max={1} step={0.01} unit="g/g" onChange={setYxs} color={SERIES.X} />
      <div className="mt-3 flex h-9 overflow-hidden rounded-md border border-line font-mono text-micro" role="img" aria-label={`${(Yxs * 100).toFixed(0)}% of substrate becomes biomass`}>
        <div className="flex items-center justify-center bg-series-x/25 text-ink transition-[width] duration-300 ease-out" style={{ width: `${Yxs * 100}%` }}>
          {Yxs > 0.15 && `biomass ${Yxs.toFixed(2)} g`}
        </div>
        <div className="flex flex-1 items-center justify-center bg-sunken text-ink-3">{Yxs < 0.9 && `CO₂, heat, other products ${(1 - Yxs).toFixed(2)} g`}</div>
      </div>
      <p className="mt-3 text-label text-ink-3">
        Most of the carbon source is respired for energy; only the fraction Yx/s ends up as new cells. With 10 g/L of substrate and Yx/s = {Yxs.toFixed(2)} you can form at most about {(10 * Yxs).toFixed(1)} g/L of biomass.
      </p>
    </Panel>
  )
}

export function DilutionExplorer() {
  const [F, setF] = useState(0.4)
  const [V, setV] = useState(2)
  const D = F / V
  return (
    <Panel title="Dilution rate D = F / V">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Range label="Flow rate F" value={F} min={0.05} max={2} step={0.05} unit="L/h" onChange={setF} color={SERIES.V} />
          <Range label="Volume V" value={V} min={0.5} max={10} step={0.5} unit="L" onChange={setV} color={SERIES.V} />
        </div>
        <div className="flex flex-col justify-center gap-1.5 font-mono text-ui" aria-live="polite">
          <div>
            D = <span className="text-lg text-ink">{D.toFixed(3)} h⁻¹</span>
          </div>
          <div className="text-ink-3">Mean residence time τ = 1/D = {(1 / D).toFixed(1)} h</div>
          <div className="text-ink-3">{(D * 100).toFixed(0)}% of the vessel volume is replaced every hour</div>
        </div>
      </div>
    </Panel>
  )
}

export function WashoutExplorer() {
  const [D, setD] = useState(0.2)
  const [Sf, setSf] = useState(20)
  const k = BASE_KINETICS
  const dCrit = criticalDilutionRate(Sf, k)
  const { xs, ss } = useMemo(() => {
    const xsPts: [number, number][] = []
    const ssPts: [number, number][] = []
    for (let d = 0.005; d < dCrit; d += 0.005) {
      const st = cstrSteadyState(d, Sf, k)
      if (!st) break
      xsPts.push([d, st.X])
      ssPts.push([d, st.S])
    }
    return { xs: xsPts, ss: ssPts }
  }, [Sf, dCrit, k])
  const here = cstrSteadyState(D, Sf, k)
  return (
    <Panel title="Steady state versus washout">
      <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-3">
          <Range label="Dilution rate D" value={D} min={0.01} max={0.8} step={0.005} unit="h⁻¹" onChange={setD} color={SERIES.V} />
          <Range label="Feed substrate Sf" value={Sf} min={2} max={100} step={1} unit="g/L" onChange={setSf} />
          <p
            className={`rounded-md px-3 py-2.5 font-mono text-label leading-relaxed ${here ? 'bg-canvas text-ink-2' : 'bg-danger-soft text-danger'}`}
            aria-live="polite"
          >
            D_crit = {dCrit.toFixed(3)} h⁻¹.{' '}
            {here ? (
              <>
                D &lt; D_crit → steady state X* = {here.X.toFixed(2)} g/L, S* = {here.S.toFixed(2)} g/L.
              </>
            ) : (
              'D ≥ D_crit → washout: X → 0 and S → Sf.'
            )}
          </p>
          <p className="text-micro text-ink-3">Uses the default kinetic parameters of the Lab (μmax = 0.4 h⁻¹, Ks = 0.5 g/L, kd = 0.005 h⁻¹).</p>
        </div>
        <LineSvg
          series={[
            { points: xs, color: SERIES.X, label: 'X* biomass' },
            { points: ss, color: SERIES.S, label: 'S* substrate' },
          ]}
          xMax={0.8}
          yMax={Math.max(Sf * 0.5, 5)}
          xLabel="Dilution rate D (1/h)"
          yLabel="Steady state (g/L)"
          vLines={[{ x: dCrit, label: 'D_crit', color: SERIES.P }]}
          markers={here ? [{ x: D, y: here.X, color: SERIES.X }] : [{ x: D, y: 0, color: SERIES.P, label: 'washout' }]}
          regions={[{ x0: dCrit, x1: 0.8, color: SERIES.P, label: 'washout region' }]}
          ariaLabel="Steady-state biomass and substrate against dilution rate, with the washout region shaded"
        />
      </div>
    </Panel>
  )
}

export function TurbidityScale() {
  const levels = [
    { x: 0.1, name: 'Just inoculated' },
    { x: 2, name: 'Growing' },
    { x: 8, name: 'Dense culture' },
  ]
  return (
    <Panel title="What biomass looks like">
      <div className="flex flex-wrap items-end justify-around gap-4">
        {levels.map((l) => {
          const t = 1 - Math.exp(-l.x / 3)
          return (
            <figure key={l.x} className="flex flex-col items-center gap-1.5">
              <svg viewBox="0 0 40 90" className="h-24" role="img" aria-label={`Culture at ${l.x} g/L biomass`}>
                <path d="M8 6 V72 Q8 84 20 84 Q32 84 32 72 V6" fill="none" stroke="#4A4F55" strokeWidth="2" />
                <path d="M9 30 V72 Q9 83 20 83 Q31 83 31 72 V30 Z" fill={mixColor([237, 230, 194], [184, 128, 41], Math.pow(t, 0.8))} opacity={0.55 + 0.45 * t} />
              </svg>
              <figcaption className="text-center text-xs">
                <span className="num font-mono text-ink">{l.x} g/L</span>
                <br />
                <span className="text-ink-3">{l.name}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
      <p className="mt-3 text-label text-ink-3">The reactor animation uses this same scale: the liquid darkens from clear to amber as biomass rises.</p>
    </Panel>
  )
}

const MODE_INFO: { type: ReactorType; name: string; inflow: string; outflow: string; volume: string; outcome: string }[] = [
  { type: 'batch', name: 'Batch', inflow: 'None after start', outflow: 'None', volume: 'Constant', outcome: 'Growth, then substrate runs out' },
  { type: 'fedbatch', name: 'Fed-batch', inflow: 'Feed at F', outflow: 'None', volume: 'Rises', outcome: 'Extended growth, higher final biomass' },
  { type: 'cstr', name: 'CSTR', inflow: 'Feed at F', outflow: 'Same F', volume: 'Constant', outcome: 'Steady state, or washout' },
]

export function ModesComparison() {
  return (
    <div className="my-6 grid border-y border-line md:grid-cols-3">
      {MODE_INFO.map((m) => (
        <div key={m.type} className="border-line p-5 md:border-r md:last:border-r-0">
          <ReactorGlyph type={m.type} className="h-16 w-20 text-ink-2" />
          <h4 className="mt-3 text-[15px] font-semibold">{m.name}</h4>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-label">
            <dt className="text-ink-3">Inflow</dt>
            <dd>{m.inflow}</dd>
            <dt className="text-ink-3">Outflow</dt>
            <dd>{m.outflow}</dd>
            <dt className="text-ink-3">Volume</dt>
            <dd>{m.volume}</dd>
            <dt className="text-ink-3">Typical result</dt>
            <dd>{m.outcome}</dd>
          </dl>
        </div>
      ))}
    </div>
  )
}

export function AnnotatedGraph() {
  const data = useMemo(() => {
    const cfg = defaultConfigFor('batch')
    const r = runSimulation(cfg)
    const pts = r.points.filter((_, i) => i % 20 === 0)
    const tEnd = pts[pts.length - 1].t
    const tSlow = pts.find((p) => p.mu < 0.9 * cfg.kinetics.muMax)?.t ?? tEnd
    const tDone = pts.find((p) => p.S < 0.05)?.t ?? tEnd
    const xMax = Math.max(...pts.map((p) => p.X))
    return { pts, tEnd, tSlow, tDone, xMax, sMax: cfg.initial.S0 }
  }, [])
  return (
    <Panel title="An annotated batch run">
      <LineSvg
        series={[
          { points: data.pts.map((p) => [p.t, p.X]), color: SERIES.X, label: 'Biomass X' },
          { points: data.pts.map((p) => [p.t, p.S * (data.xMax / data.sMax)]), color: SERIES.S, label: 'Substrate S (scaled)' },
        ]}
        xMax={data.tEnd}
        yMax={Math.ceil(data.xMax + 0.5)}
        xLabel="Time (h)"
        yLabel="Biomass (g/L)"
        regions={[
          { x0: 0, x1: data.tSlow, color: SERIES.mu, label: 'μ ≈ μmax' },
          { x0: data.tSlow, x1: data.tDone, color: SERIES.X, label: 'slowing' },
          { x0: data.tDone, x1: data.tEnd, color: INK[3], label: 'S ≈ 0' },
        ]}
        ariaLabel="Annotated batch run showing exponential growth, slowing and substrate depletion"
      />
      <p className="mt-3 text-label text-ink-3">
        Real output of the model with default batch parameters. Regions are found from the data: growth is near maximum while μ ≥ 90% of μmax, then slows, and ends once substrate is essentially gone (S &lt; 0.05 g/L). The slow decline afterwards is cell death k<sub>d</sub>. This model has no lag phase.
      </p>
    </Panel>
  )
}

export function VesselAnatomy() {
  const cfg = useMemo(() => defaultConfigFor('cstr'), [])
  const parts = [
    ['Vessel', 'Glass or steel tank holding the culture (working volume V).'],
    ['Impeller', 'Mixes so the culture is uniform, the ideal-mixing assumption of the model.'],
    ['Sparger', 'Bubbles air through the medium to supply oxygen. Oxygen is not simulated here.'],
    ['Probes', 'pH and dissolved-oxygen sensors. Also not simulated.'],
    ['Feed line', 'Brings fresh medium or concentrated feed in at flow rate F.'],
    ['Outflow', 'CSTR only: removes culture at the same rate, keeping V constant.'],
  ]
  return (
    <div className="my-6 grid items-center gap-8 md:grid-cols-[minmax(0,280px)_1fr]">
      <ReactorViz point={null} config={cfg} extents={null} showLegend={false} className="mx-auto h-auto w-full max-w-[300px]" />
      <ul className="grid text-ui">
        {parts.map(([name, text]) => (
          <li key={name} className="border-b border-line py-2.5 last:border-b-0">
            <span className="font-medium text-ink">{name}. </span>
            <span className="text-ink-3">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
