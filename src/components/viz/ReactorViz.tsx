import { memo, useId } from 'react'
import { clamp, mixColor } from '../../lib/format'
import { isWashedOutAt } from '../../simulation/metrics'
import type { ReactorConfig, RunExtents, SimPoint } from '../../simulation/types'
import { FONT, INK, SERIES } from '../../lib/palette'

/**
 * Animated reactor vessel driven entirely by the simulated state.
 *
 *   liquid level      <- volume V (fed-batch rises; batch/CSTR constant)
 *   liquid turbidity  <- biomass X (absolute scale: 1 - exp(-X/3))
 *   ochre cells       <- biomass X
 *   blue dots         <- substrate S, relative to its peak in the run
 *   berry dots        <- product P, relative to its peak in the run
 *   gas bubbles       <- constant aeration + metabolic gas ~ mu*X
 *   feed / outflow    <- flow rate F (fed-batch) or D*V (CSTR)
 *   feed bottle level <- fed volume so far (V - V0)
 *
 * The impeller rate is an operating setting, not a simulated state.
 */

interface ReactorVizProps {
  point: SimPoint | null
  config: ReactorConfig
  extents: RunExtents | null
  playing?: boolean
  showLegend?: boolean
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
}

// Vessel geometry (viewBox 400 x 470)
const CX = 220
const X0 = 140
const X1 = 300
const TOP = 100
const BOT = 388
const BODY = `M${X0} 96 V366 Q${X0} 392 ${X0 + 24} 392 H${X1 - 24} Q${X1} 392 ${X1} 366 V96 Z`
const INNER = `M${X0 + 4} 96 V366 Q${X0 + 4} 388 ${X0 + 24} 388 H${X1 - 24} Q${X1 - 4} 388 ${X1 - 4} 366 V96 Z`

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Dot {
  x: number
  y: number
  r: number
  dur: number
  delay: number
  dx: number
  dy: number
}

function makeDots(n: number, seed: number, rMin: number, rMax: number): Dot[] {
  const r = rng(seed)
  return Array.from({ length: n }, () => ({
    x: X0 + 10 + r() * (X1 - X0 - 20),
    y: TOP + 6 + r() * (BOT - TOP - 14),
    r: rMin + r() * (rMax - rMin),
    dur: 4 + r() * 5,
    delay: -r() * 8,
    dx: 3 + r() * 6,
    dy: -(2 + r() * 5),
  }))
}

const N_CELLS = 90
const N_SUBSTRATE = 46
const N_PRODUCT = 34
const CELLS = makeDots(N_CELLS, 11, 1.7, 3.3)
const SUBSTRATE = makeDots(N_SUBSTRATE, 23, 1, 1.6)
const PRODUCT = makeDots(N_PRODUCT, 37, 1.2, 2)

const BUBBLES = (() => {
  const r = rng(5)
  return Array.from({ length: 18 }, () => ({
    x: CX - 34 + r() * 68,
    r: 1.6 + r() * 2.6,
    dur: 2.4 + r() * 2.6,
    delay: -r() * 5,
  }))
})()

const Field = memo(function Field({ dots, n, fill, opacity }: { dots: Dot[]; n: number; fill: string; opacity: number }) {
  return (
    <g fill={fill} opacity={opacity}>
      {dots.slice(0, n).map((d, i) => (
        <circle
          key={i}
          className="cell"
          cx={d.x}
          cy={d.y}
          r={d.r}
          style={{ ['--dur' as string]: `${d.dur}s`, ['--delay' as string]: `${d.delay}s`, ['--dx' as string]: `${d.dx}px`, ['--dy' as string]: `${d.dy}px` }}
        />
      ))}
    </g>
  )
})

const Bubbles = memo(function Bubbles({ n }: { n: number }) {
  return (
    <g fill="rgba(255,255,255,0.35)" stroke="#6B7077" strokeWidth="0.7">
      {BUBBLES.slice(0, n).map((b, i) => (
        <circle
          key={i}
          className="bubble"
          cx={b.x}
          cy={378}
          r={b.r}
          style={{ ['--dur' as string]: `${b.dur}s`, ['--delay' as string]: `${b.delay}s`, ['--rise' as string]: '-300px' }}
        />
      ))}
    </g>
  )
})

/** Sine surface; the wrapping <g> is translated by CSS for a gentle swell. */
const WAVE = 'M-80 0 q20 -3 40 0' + ' t40 0'.repeat(11)

function ReactorViz({ point, config, extents, playing = false, showLegend = true, className, svgRef }: ReactorVizProps) {
  const uid = useId().replace(/:/g, '')
  const { reactorType } = config

  // Idle preview: show the initial conditions before any run.
  const p: SimPoint = point ?? { t: 0, X: config.initial.X0, S: config.initial.S0, P: config.initial.P0, V: config.initial.V0, mu: 0 }
  const V0 = config.initial.V0
  const ext: RunExtents =
    extents ?? {
      maxX: config.initial.X0,
      maxS: Math.max(config.initial.S0, 1e-6),
      maxP: 1,
      maxV: reactorType === 'fedbatch' ? V0 + config.fedBatch.F * config.settings.duration : V0,
      maxMu: 0,
      maxMuX: 1,
      tPeakX: 0,
      duration: config.settings.duration,
    }

  const cap = reactorType === 'fedbatch' ? Math.max(ext.maxV, V0, 1e-6) / 0.88 : p.V / 0.66
  const frac = clamp(p.V / cap, 0.08, 0.95)
  const liquidTop = BOT - frac * (BOT - TOP)

  const turbidity = 1 - Math.exp(-p.X / 3)
  const liquid = mixColor([237, 230, 194], [184, 128, 41], Math.pow(turbidity, 0.8))
  const liquidOpacity = 0.6 + 0.4 * turbidity

  const nCells = Math.round(N_CELLS * turbidity)
  const nSub = Math.round(N_SUBSTRATE * clamp(p.S / Math.max(ext.maxS, 1e-6), 0, 1))
  const nProd = Math.round(N_PRODUCT * clamp(p.P / Math.max(ext.maxP, 1e-6), 0, 1))
  const gas = ext.maxMuX > 0 ? clamp((p.mu * p.X) / ext.maxMuX, 0, 1) : 0
  const nBubbles = 6 + Math.round(12 * gas)

  const washedOut = isWashedOutAt(config, p, ext)

  const flowRel =
    reactorType === 'fedbatch' ? clamp(config.fedBatch.F / 0.5, 0, 1) : reactorType === 'cstr' ? clamp(config.cstr.D, 0, 1) : 0
  const flowSpeed = clamp(1.5 - 1.2 * flowRel, 0.3, 1.5)
  const flowWidth = 2.5 + 3 * flowRel
  const feedActive = (reactorType === 'fedbatch' && config.fedBatch.F > 0) || reactorType === 'cstr'

  // Feed bottle level: fed-batch drains with the fed volume, CSTR stays full.
  const fedTotal = Math.max(ext.maxV - V0, 1e-9)
  const bottleFrac = reactorType === 'fedbatch' ? 1 - clamp((p.V - V0) / fedTotal, 0, 1) * 0.92 : 1
  const feedConc = reactorType === 'fedbatch' ? config.fedBatch.Sf : config.cstr.Sf

  const outletY = Math.min(liquidTop + 14, BOT - 30)
  const clipId = `clip-${uid}`
  const liqClip = `liq-${uid}`
  const shadeId = `shade-${uid}`

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 470"
      className={`${playing ? '' : 'viz-paused'} ${className ?? ''}`}
      role="img"
      aria-label={`Animated ${reactorType} bioreactor. Volume ${p.V.toFixed(2)} litres, biomass ${p.X.toFixed(2)} grams per litre, substrate ${p.S.toFixed(2)} grams per litre.${washedOut ? ' The culture has washed out.' : ''}`}
      fontFamily={FONT.mono}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={INNER} />
        </clipPath>
        <clipPath id={liqClip}>
          <rect x={X0 - 90} y={liquidTop} width={X1 - X0 + 180} height={BOT - liquidTop + 10} />
        </clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4A4F55" stopOpacity="0.14" />
          <stop offset="0.14" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="0.86" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#4A4F55" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Soft floor glow */}
      <ellipse cx={CX} cy={412} rx={120} ry={10} fill="rgba(23,25,28,0.08)" />

      {/* ---- Inside the vessel (clipped to the glass) ---- */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={X0} y={96} width={X1 - X0} height={BOT - 96} fill="#FAFAF8" />
        <g clipPath={`url(#${liqClip})`}>
          <rect x={X0} y={liquidTop} width={X1 - X0} height={BOT - liquidTop + 4} fill={liquid} opacity={liquidOpacity} />
          <rect x={X0} y={liquidTop} width={X1 - X0} height={BOT - liquidTop + 4} fill={`url(#${shadeId})`} />
          <Field dots={SUBSTRATE} n={nSub} fill={SERIES.S} opacity={0.9} />
          <Field dots={PRODUCT} n={nProd} fill={SERIES.P} opacity={0.9} />
          <Field dots={CELLS} n={nCells} fill="#D99A22" opacity={0.95} />
          <Bubbles n={nBubbles} />
        </g>
        {/* Liquid surface swell */}
        <g transform={`translate(0 ${liquidTop})`}>
          <path className="wave" d={`${WAVE} V8 H-80 Z`} fill={liquid} opacity={Math.min(liquidOpacity + 0.1, 0.95)} />
        </g>

        {/* Impellers (Rushton-style, side view). Upper one only when submerged. */}
        <line x1={CX} y1={84} x2={CX} y2={354} stroke="#8A9096" strokeWidth="3" />
        {[354, 282].map((y) =>
          y > liquidTop + 6 ? (
            <g key={y}>
              <ellipse cx={CX} cy={y} rx={30} ry={3} fill="#6B7077" opacity="0.7" />
              <rect className="blade" x={CX - 32} y={y - 8} width={64} height={12} rx={2} fill="#A9AFB4" opacity="0.92" />
            </g>
          ) : null
        )}
      </g>

      {/* Sparger */}
      <path d={`M${CX - 40} 379 H${CX + 40}`} stroke="#8A9096" strokeWidth="3" strokeLinecap="round" />

      {/* Glass wall, highlights and head plate */}
      <path d={BODY} fill={`url(#glass-${uid})`} stroke="#4A4F55" strokeWidth="1.6" />
      <path d={`M${X0 + 9} 110 V340`} stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
      <rect x={X0 - 8} y={84} width={X1 - X0 + 16} height={12} rx={3} fill="#C9CED2" stroke="#8A9096" strokeWidth="1" />
      <rect x={CX - 20} y={54} width={40} height={30} rx={4} fill="#2B2F33" stroke="#17191C" strokeWidth="1" />
      <text x={CX} y={73} textAnchor="middle" fontSize="9" fill="#E3E3DF">
        MOTOR
      </text>
      {/* pH / DO probes */}
      {[X1 - 22, X1 - 40].map((x) => (
        <line key={x} x1={x} y1={84} x2={x} y2={Math.min(liquidTop + 60, 340)} stroke="#6B7077" strokeWidth="2" strokeLinecap="round" />
      ))}

      {/* ---- Feed line (fed-batch and CSTR) ---- */}
      {feedActive && (
        <g>
          <rect x={16} y={14} width={62} height={58} rx={6} fill="rgba(255,255,255,0.6)" stroke="#8A9096" strokeWidth="1.5" />
          <rect
            x={19}
            y={14 + 58 - 3 - 52 * bottleFrac}
            width={56}
            height={52 * bottleFrac}
            rx={4}
            fill="#D8CFA4"
            opacity="0.8"
          />
          <text x={47} y={90} textAnchor="middle" fontSize="9.5" fill={INK[3]}>
            {reactorType === 'fedbatch' ? 'FEED' : 'MEDIUM'}
          </text>
          <text x={47} y={102} textAnchor="middle" fontSize="9.5" fill={INK[2]}>
            {`${feedConc} g/L`}
          </text>
          <path d={`M78 40 H178 V110`} fill="none" stroke="#DCDCD7" strokeWidth={flowWidth + 3} strokeLinecap="round" strokeLinejoin="round" />
          <path
            className="flowline"
            d={`M78 40 H178 V110`}
            fill="none"
            stroke="#B8AE84"
            strokeWidth={flowWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ ['--flow' as string]: `${flowSpeed}s` }}
          />
        </g>
      )}

      {/* ---- CSTR outlet ---- */}
      {reactorType === 'cstr' && (
        <g>
          <path d={`M${X1 - 2} ${outletY} H372 V300`} fill="none" stroke="#DCDCD7" strokeWidth={flowWidth + 3} strokeLinecap="round" strokeLinejoin="round" />
          <path
            className="flowline"
            d={`M${X1 - 2} ${outletY} H372 V300`}
            fill="none"
            stroke={liquid}
            strokeWidth={flowWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={liquidOpacity + 0.2}
            style={{ ['--flow' as string]: `${flowSpeed}s` }}
          />
          <text x={372} y={322} textAnchor="middle" fontSize="9.5" fill={INK[3]}>
            OUTFLOW
          </text>
          <text x={372} y={334} textAnchor="middle" fontSize="9.5" fill={INK[2]}>
            {`${(config.cstr.D * p.V).toFixed(2)} L/h`}
          </text>
        </g>
      )}

      {/* ---- Readouts ---- */}
      <text x={CX} y={432} textAnchor="middle" fontSize="12" fill={INK[1]}>
        {`V = ${p.V.toFixed(2)} L`}
      </text>
      <text x={24} y={196} fontSize="10" fill={INK[3]}>
        {`t = ${p.t.toFixed(1)} h`}
      </text>
      <text x={24} y={210} fontSize="10" fill={INK[3]}>
        {reactorType === 'batch' ? 'closed system' : reactorType === 'fedbatch' ? 'fed-batch' : 'continuous'}
      </text>

      {washedOut && (
        <g>
          <rect x={CX - 52} y={liquidTop - 30 < 110 ? 118 : liquidTop - 30} width={104} height={22} rx={11} fill="#FDEDEB" stroke="#B42318" />
          <text x={CX} y={(liquidTop - 30 < 110 ? 118 : liquidTop - 30) + 15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#B42318">
            WASHOUT
          </text>
        </g>
      )}

      {showLegend && (
        <g fontSize="10" fill={INK[3]}>
          <circle cx={92} cy={456} r={3.4} fill="#D99A22" />
          <text x={100} y={459}>cells</text>
          <circle cx={156} cy={456} r={2.4} fill={SERIES.S} />
          <text x={164} y={459}>substrate</text>
          <circle cx={242} cy={456} r={2.6} fill={SERIES.P} />
          <text x={250} y={459}>product</text>
        </g>
      )}
    </svg>
  )
}

export default memo(ReactorViz)
