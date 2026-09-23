import { useEffect, useState } from 'react'
import { EquationBlock } from '../components/ui/Eq'
import { LEARN_TOPICS } from '../content/topics'
import type { LearnTopicId } from '../content/topics'
import { RATE_LAWS } from '../content/equations'
import { hrefFor } from '../hooks/useHashRoute'
import {
  AnnotatedGraph,
  DilutionExplorer,
  ModesComparison,
  MonodExplorer,
  ProductExplorer,
  TurbidityScale,
  VesselAnatomy,
  WashoutExplorer,
  YieldExplorer,
} from '../components/learn/Interactives'

const P = ({ children }: { children: React.ReactNode }) => <p className="mb-3 text-[15px] leading-relaxed text-paper/90">{children}</p>

const CONTENT: Record<LearnTopicId, React.ReactNode> = {
  bioreactor: (
    <>
      <P>
        A bioreactor is a vessel in which living cells (bacteria, yeast, fungi or mammalian cells) are grown under controlled conditions to make cells, or something the cells produce: an enzyme, an antibiotic, ethanol, a vaccine antigen. The design aims to give every cell the same conditions: mixed, aerated, fed and held at the right temperature and pH.
      </P>
      <P>
        Real reactors control many things. This model keeps only the core question of bioprocess engineering: how do the amounts of cells, nutrient and product change with time?
      </P>
      <VesselAnatomy />
    </>
  ),
  biomass: (
    <>
      <P>
        Biomass is the mass of living cells. In the model it is a concentration <em>X</em> in grams of dry cells per litre. As cells take up substrate and divide, <em>X</em> rises; when cells die or are removed, it falls.
      </P>
      <P>
        Growth is autocatalytic: the more cells there are, the more new cells they make. That is why growth starts slowly in absolute terms and then accelerates, before something (usually running out of food) limits it.
      </P>
      <TurbidityScale />
    </>
  ),
  substrate: (
    <>
      <P>
        Substrate is the limiting nutrient: the one whose supply decides how fast the cells can grow and how much biomass can form. It is often a sugar such as glucose. The model assumes every other nutrient is in excess, so exactly one substrate matters.
      </P>
      <P>
        Substrate <em>S</em> is consumed for growth, for making product, and for maintenance (energy to stay alive). When it approaches zero, growth stops.
      </P>
      <EquationBlock lines={[RATE_LAWS.uptake]} accent="#46e0c8" label="Substrate uptake" />
      <P>
        Here <em>q</em>
        <sub>S</sub> is how much substrate one gram of biomass takes up per hour: growth uses <em>μ</em>/Y<sub>x/s</sub>, product uses <em>q</em>
        <sub>p</sub>/Y<sub>p/s</sub> and maintenance uses <em>m</em>
        <sub>s</sub>.
      </P>
    </>
  ),
  product: (
    <>
      <P>
        Product is what the culture makes for us. Some products form only while cells grow (growth-associated, for example many primary metabolites such as ethanol or lactic acid). Others form mostly when growth has slowed (non-growth-associated, typical of many secondary metabolites such as antibiotics).
      </P>
      <P>The Luedeking–Piret equation covers both with two coefficients:</P>
      <EquationBlock lines={[RATE_LAWS.product]} accent="#f0805f" label="Luedeking-Piret" />
      <P>
        Here <em>α</em> ties product to growth and <em>β</em> ties it to the amount of biomass regardless of growth.
      </P>
      <ProductExplorer />
    </>
  ),
  monod: (
    <>
      <P>
        Growth rate depends on how much food there is. At very low substrate, cells grow slowly; as substrate rises, growth speeds up and then saturates: even unlimited food cannot make cells grow beyond a genetic maximum. This looks exactly like enzyme saturation kinetics, and Jacques Monod described it this way in 1949.
      </P>
      <EquationBlock lines={[RATE_LAWS.monod]} accent="#9fd18a" label="Monod equation" />
      <P>
        <em>μ</em>
        <sub>max</sub> is the ceiling on growth rate. <em>K</em>
        <sub>s</sub> is the substrate concentration that gives half of that maximum, so a small <em>K</em>
        <sub>s</sub> describes an organism that grows well even on little substrate. The doubling time is ln 2 / <em>μ</em>.
      </P>
      <MonodExplorer />
    </>
  ),
  yield: (
    <>
      <P>
        Yield says how efficiently substrate becomes something useful. The biomass yield <em>Y</em>
        <sub>x/s</sub> is the grams of cells formed per gram of substrate used. It is below 1 because much of the substrate is oxidised to supply energy (and released as CO₂ and heat).
      </P>
      <EquationBlock lines={['Y_{x/s} = ΔX / (−ΔS)', 'Y_{p/s} = ΔP / (−ΔS)']} label="Yield definitions" />
      <P>
        In the Lab, the yield shown live is the <em>realized</em> yield from whole-vessel mass balances, so it also reflects maintenance and product formation, which use substrate without making biomass.
      </P>
      <YieldExplorer />
    </>
  ),
  dilution: (
    <>
      <P>
        In a continuous or fed-batch process, liquid flows through the vessel. The dilution rate is the flow rate divided by the volume: the fraction of the vessel replaced per hour. Its reciprocal is the average time a drop of liquid stays in the reactor.
      </P>
      <EquationBlock lines={['D = F / V', 'τ = 1 / D']} label="Dilution rate" />
      <P>
        Anything dissolved or suspended in the liquid, including the cells, is carried out at rate <em>D</em> in a CSTR. In fed-batch nothing leaves, but the growing volume dilutes concentrations, and <em>D</em> = <em>F</em>/<em>V</em> falls with time.
      </P>
      <DilutionExplorer />
    </>
  ),
  modes: (
    <>
      <P>
        The three modes differ only in what crosses the vessel boundary. That single difference changes the whole behaviour of the culture, and in the model it changes only the terms containing <em>D</em> and the volume equation.
      </P>
      <ModesComparison />
      <P>
        <strong>Batch</strong> is simplest, but substrate only ever falls, so growth eventually stops. <strong>Fed-batch</strong> keeps adding substrate, avoiding early overfeeding and letting the culture reach a higher density. <strong>CSTR</strong> holds the culture in a constant environment, and the operator sets the growth rate by choosing <em>D</em>.
      </P>
    </>
  ),
  washout: (
    <>
      <P>
        In a CSTR, cells are constantly leaving. If they cannot reproduce at least as fast as they leave, the population shrinks, and once it is small it consumes little substrate, so the substrate rises even more and growth is still capped at <em>μ</em>
        <sub>max</sub>. Eventually the vessel holds fresh medium and no cells: washout.
      </P>
      <P>There is a critical dilution rate above which this is inevitable. Below it, the culture settles at a steady state.</P>
      <EquationBlock lines={['D_{crit} = μ_{max} S_{f} / (K_{s} + S_{f}) − k_{d}', 'steady state: μ = D + k_{d}']} accent="#f0805f" label="Critical dilution rate" />
      <WashoutExplorer />
      <P>
        Try it in the Lab: the “Stable CSTR” and “CSTR Washout” experiments differ only in <em>D</em>. <a className="text-aqua hover:underline" href={hrefFor('experiments', 'cstr-washout')}>See the washout experiment →</a>
      </P>
    </>
  ),
  graphs: (
    <>
      <P>
        Every run produces the same three views. The reactor shows the physical picture, the metric cards show exact numbers at the current time, and the charts show the history.
      </P>
      <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-paper/90">
        <li>
          <strong className="text-readout-biomass">Biomass</strong> rises while there is substrate, then plateaus and slowly falls (death, or washout in a CSTR).
        </li>
        <li>
          <strong className="text-readout-substrate">Substrate</strong> falls as it is consumed. When it reaches zero, growth ends. In fed-batch and CSTR it is replenished by the feed.
        </li>
        <li>
          <strong className="text-readout-product">Product</strong> accumulates as long as there are cells, faster while growing if <em>α</em> &gt; 0.
        </li>
        <li>
          <strong className="text-readout-growth">Growth rate</strong> falls from near <em>μ</em>
          <sub>max</sub> to zero as substrate becomes limiting. In a CSTR at steady state it settles at <em>D</em> + <em>k</em>
          <sub>d</sub>.
        </li>
        <li>
          <strong className="text-readout-volume">Volume</strong> (fed-batch) rises linearly with the feed.
        </li>
      </ul>
      <AnnotatedGraph />
    </>
  ),
}

export default function LearnPage({ section }: { section: string | null }) {
  const [open, setOpen] = useState<Set<string>>(new Set(section ? [section] : ['bioreactor']))

  useEffect(() => {
    if (!section) return
    setOpen((prev) => new Set(prev).add(section))
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [section])

  const toggle = (id: string, isOpen: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (isOpen) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-10 sm:px-6">
      <header className="mb-10 max-w-3xl">
        <div className="eyebrow">Learn</div>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">The science, concept first</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Ten short topics at B.Sc. biotechnology level. Each explains the idea in words, then shows the equation, then lets you play with it. Open the topics you need.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(new Set(LEARN_TOPICS.map((t) => t.id)))}>
            Expand all
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(new Set())}>
            Collapse all
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Topics" className="hidden lg:block">
          <ol className="sticky top-24 flex flex-col gap-0.5 border-l border-ink-600">
            {LEARN_TOPICS.map((t, i) => (
              <li key={t.id}>
                <a
                  href={hrefFor('learn', t.id)}
                  className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                    open.has(t.id) ? 'border-aqua text-paper' : 'border-transparent text-muted hover:text-paper'
                  }`}
                >
                  <span className="mr-2 font-mono text-[11px] text-dim">{String(i + 1).padStart(2, '0')}</span>
                  {t.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-3">
          {LEARN_TOPICS.map((t, i) => (
            <details
              key={t.id}
              id={t.id}
              open={open.has(t.id)}
              onToggle={(e) => toggle(t.id, (e.currentTarget as HTMLDetailsElement).open)}
              className="glass group scroll-mt-24"
            >
              <summary className="flex cursor-pointer items-center gap-4 px-5 py-4">
                <span className="font-mono text-xs text-aqua">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="flex-1 font-display text-xl font-semibold">{t.title}</h2>
                <span className="text-xl text-muted transition-transform duration-300 group-open:rotate-90" aria-hidden="true">
                  ›
                </span>
              </summary>
              <div className="border-t border-ink-600/70 px-5 pb-5 pt-4">{open.has(t.id) && CONTENT[t.id]}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
