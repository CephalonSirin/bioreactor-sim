import { useEffect, useState } from 'react'
import { EquationBlock } from '../components/ui/Eq'
import { LEARN_TOPICS } from '../content/topics'
import type { LearnTopicId } from '../content/topics'
import { RATE_LAWS } from '../content/equations'
import { SERIES } from '../lib/palette'
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

const P = ({ children }: { children: React.ReactNode }) => <p className="mb-4 max-w-prose text-body leading-[1.7] text-ink-2">{children}</p>

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
      <EquationBlock lines={[RATE_LAWS.uptake]} number={1} label="Substrate uptake" />
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
      <EquationBlock lines={[RATE_LAWS.product]} number={2} label="Luedeking-Piret" />
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
      <EquationBlock lines={[RATE_LAWS.monod]} number={3} label="Monod equation" />
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
      <EquationBlock lines={['Y_{x/s} = ΔX / (−ΔS)', 'Y_{p/s} = ΔP / (−ΔS)']} number={4} label="Yield definitions" />
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
      <EquationBlock lines={['D = F / V', 'τ = 1 / D']} number={5} label="Dilution rate" />
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
      <EquationBlock lines={['D_{crit} = μ_{max} S_{f} / (K_{s} + S_{f}) − k_{d}', 'μ* = D + k_{d}']} number={6} label="Critical dilution rate and steady state" />
      <WashoutExplorer />
      <P>
        Try it in the Lab: the “Stable CSTR” and “CSTR Washout” experiments differ only in <em>D</em>. <a className="link" href={hrefFor('experiments', 'cstr-washout')}>See the washout experiment (E-08)</a>
      </P>
    </>
  ),
  graphs: (
    <>
      <P>
        Every run produces the same three views. The reactor shows the physical picture, the measurements panel shows exact values at the current time, and the charts show the history.
      </P>
      <ul className="mb-4 max-w-prose space-y-2.5 text-body leading-relaxed text-ink-2">
        <li>
          <strong className="font-semibold text-ink"><span className="swatch mr-2 -translate-y-[3px]" style={{ color: SERIES.X }} />Biomass</strong> rises while there is substrate, then plateaus and slowly falls (death, or washout in a CSTR).
        </li>
        <li>
          <strong className="font-semibold text-ink"><span className="swatch mr-2 -translate-y-[3px]" style={{ color: SERIES.S }} />Substrate</strong> falls as it is consumed. When it reaches zero, growth ends. In fed-batch and CSTR it is replenished by the feed.
        </li>
        <li>
          <strong className="font-semibold text-ink"><span className="swatch mr-2 -translate-y-[3px]" style={{ color: SERIES.P }} />Product</strong> accumulates as long as there are cells, faster while growing if <em>α</em> &gt; 0.
        </li>
        <li>
          <strong className="font-semibold text-ink"><span className="swatch mr-2 -translate-y-[3px]" style={{ color: SERIES.mu }} />Growth rate</strong> falls from near <em>μ</em>
          <sub>max</sub> to zero as substrate becomes limiting. In a CSTR at steady state it settles at <em>D</em> + <em>k</em>
          <sub>d</sub>.
        </li>
        <li>
          <strong className="font-semibold text-ink"><span className="swatch mr-2 -translate-y-[3px]" style={{ color: SERIES.V }} />Volume</strong> (fed-batch) rises linearly with the feed.
        </li>
      </ul>
      <AnnotatedGraph />
    </>
  ),
}

export default function LearnPage({ section }: { section: string | null }) {
  const [active, setActive] = useState<string>(section ?? LEARN_TOPICS[0].id)

  useEffect(() => {
    if (!section) return
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [section])

  // Track the chapter being read for the contents rail.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' }
    )
    LEARN_TOPICS.forEach((t) => {
      const el = document.getElementById(t.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const activeIndex = LEARN_TOPICS.findIndex((t) => t.id === active)

  return (
    <div className="mx-auto max-w-page px-4 pb-10 pt-12 sm:px-6 lg:pt-16">
      <header className="grid gap-6 border-b border-ink pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <h1 className="t-page max-w-[14ch]">Bioreactor kinetics, from first principles</h1>
        <p className="max-w-prose text-body text-ink-2">
          Ten short chapters at undergraduate level. Each states the idea in words, then gives the equation, then lets you change it. The equations are the ones the Lab integrates.
        </p>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]">
        <nav aria-label="Chapters" className="hidden lg:block">
          <ol className="sticky top-[calc(var(--nav-h)+32px)] flex flex-col">
            {LEARN_TOPICS.map((t, i) => {
              const on = t.id === active
              return (
                <li key={t.id}>
                  <a
                    href={hrefFor('learn', t.id)}
                    aria-current={on ? 'location' : undefined}
                    className={`group flex items-baseline gap-3 border-l py-1.5 pl-4 text-ui transition-colors duration-200 ${
                      on ? 'border-ink text-ink' : i < activeIndex ? 'border-ink-4 text-ink-3 hover:text-ink' : 'border-line text-ink-3 hover:text-ink'
                    }`}
                  >
                    <span className="num w-4 font-mono text-micro text-ink-4">{i + 1}</span>
                    <span className={on ? 'font-medium' : ''}>{t.title}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="min-w-0 [&_em]:font-math [&_em]:text-[1.08em]">
          {LEARN_TOPICS.map((t, i) => (
            <section key={t.id} id={t.id} aria-labelledby={`${t.id}-h`} className="scroll-mt-[calc(var(--nav-h)+24px)] border-b border-line pb-14 pt-2 [&:not(:first-child)]:pt-12 last:border-b-0">
              <div className="mb-6 flex items-baseline gap-4">
                <span className="num font-mono text-label text-ink-4">{String(i + 1).padStart(2, '0')}</span>
                <h2 id={`${t.id}-h`} className="t-section">
                  {t.title}
                </h2>
              </div>
              {CONTENT[t.id]}
            </section>
          ))}
        </div>

        <aside className="hidden xl:block" aria-label="In the Lab">
          <div className="sticky top-[calc(var(--nav-h)+32px)] space-y-3 text-label text-ink-3">
            <p className="font-medium text-ink-2">Try it in the Lab</p>
            <p>Every chapter maps to a parameter you can change and run.</p>
            <a href={hrefFor('lab')} className="btn-secondary btn-sm mt-1">
              Open the Lab
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
