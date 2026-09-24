import { memo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ParameterSlider from './ParameterSlider'
import { criticalDilutionRate } from '../../simulation/kinetics'
import type { ReactorConfig } from '../../simulation/types'

interface ParameterPanelProps {
  config: ReactorConfig
  /** The loaded experiment's configuration, to mark edited values. */
  reference: ReactorConfig
  onChange: (config: ReactorConfig) => void
  disabled?: boolean
}

function Group({ title, note, children, defaultOpen = true }: { title: string; note?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="t-acc border-b border-line last:border-b-0" data-open={open}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 py-3 text-left text-ui font-semibold text-ink transition-colors hover:text-ink-2"
        >
          <span className="flex-1">{title}</span>
          {note && <span className="text-micro font-normal text-ink-3">{note}</span>}
          <ChevronDown className="t-acc-chevron h-4 w-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </h3>
      <div className="t-acc-panel">
        <div className="t-acc-inner">
          <div className="pb-3">{children}</div>
        </div>
      </div>
    </section>
  )
}

function CriticalHint({ config }: { config: ReactorConfig }) {
  const dCrit = criticalDilutionRate(config.cstr.Sf, config.kinetics)
  const washout = config.cstr.D >= dCrit
  const margin = dCrit > 0 ? Math.min(config.cstr.D / dCrit, 1.25) : 1.25
  return (
    <div className="mb-1 mt-1 rounded-md border border-line bg-canvas px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2 text-label">
        <span className="text-ink-2">
          <span className="math text-[14px]">D</span> relative to <span className="math text-[14px]">D</span>
          <sub className="math">crit</sub> = <span className="num font-mono">{dCrit.toFixed(3)}</span> h⁻¹
        </span>
        <span className={`font-medium ${washout ? 'text-danger' : 'text-ok'}`}>{washout ? 'Washout' : 'Stable'}</span>
      </div>
      <div className="relative mt-2 h-1 rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full bg-ink-2 transition-[width] duration-200 ease-out" style={{ width: `${(margin / 1.25) * 100}%` }} />
        <div className="absolute -top-1 h-3 w-px bg-danger" style={{ left: `${100 / 1.25}%` }} />
      </div>
    </div>
  )
}

function ParameterPanel({ config, reference, onChange, disabled }: ParameterPanelProps) {
  const update = (patch: Partial<ReactorConfig>) => onChange({ ...config, ...patch })
  const { initial: i0, kinetics: k, fedBatch: fb, cstr, settings: st } = config
  const ch = (a: number, b: number) => Math.abs(a - b) > 1e-12

  return (
    <div className="flex flex-col">
      {config.reactorType === 'fedbatch' && (
        <Group title="Feed">
          <ParameterSlider
            label="Feed rate"
            symbol="F"
            unit="L/h"
            value={fb.F}
            min={0}
            max={0.5}
            step={0.005}
            disabled={disabled}
            changed={ch(fb.F, reference.fedBatch.F)}
            onChange={(v) => update({ fedBatch: { ...fb, F: v } })}
            tooltip="Volumetric flow of fresh feed into the vessel. With F = 0 the run is identical to a batch."
          />
          <ParameterSlider
            label="Feed substrate"
            symbol="S_{f}"
            unit="g/L"
            value={fb.Sf}
            min={1}
            max={300}
            step={1}
            disabled={disabled}
            changed={ch(fb.Sf, reference.fedBatch.Sf)}
            onChange={(v) => update({ fedBatch: { ...fb, Sf: v } })}
            tooltip="Substrate concentration in the feed, usually far above the concentration in the vessel."
          />
        </Group>
      )}

      {config.reactorType === 'cstr' && (
        <Group title="Continuous flow">
          <ParameterSlider
            label="Dilution rate"
            symbol="D"
            unit="h⁻¹"
            value={cstr.D}
            min={0.01}
            max={1}
            step={0.005}
            disabled={disabled}
            changed={ch(cstr.D, reference.cstr.D)}
            onChange={(v) => update({ cstr: { ...cstr, D: v } })}
            tooltip="D = F/V, the fraction of the vessel volume replaced each hour. Above the critical dilution rate cells leave faster than they can grow."
          />
          <CriticalHint config={config} />
          <ParameterSlider
            label="Feed substrate"
            symbol="S_{f}"
            unit="g/L"
            value={cstr.Sf}
            min={1}
            max={100}
            step={1}
            disabled={disabled}
            changed={ch(cstr.Sf, reference.cstr.Sf)}
            onChange={(v) => update({ cstr: { ...cstr, Sf: v } })}
            tooltip="Substrate concentration in the continuous feed stream."
          />
        </Group>
      )}

      <Group title="Initial conditions">
        <ParameterSlider
          label="Biomass"
          symbol="X_{0}"
          unit="g/L"
          value={i0.X0}
          min={0.01}
          max={5}
          step={0.01}
          disabled={disabled}
          changed={ch(i0.X0, reference.initial.X0)}
          onChange={(v) => update({ initial: { ...i0, X0: v } })}
          tooltip="Cell concentration at t = 0 (the inoculum), in grams of dry biomass per litre."
        />
        <ParameterSlider
          label="Substrate"
          symbol="S_{0}"
          unit="g/L"
          value={i0.S0}
          min={0}
          max={50}
          step={0.1}
          disabled={disabled}
          changed={ch(i0.S0, reference.initial.S0)}
          onChange={(v) => update({ initial: { ...i0, S0: v } })}
          tooltip="Concentration of the limiting substrate (for example glucose) at t = 0."
        />
        <ParameterSlider
          label="Product"
          symbol="P_{0}"
          unit="g/L"
          value={i0.P0}
          min={0}
          max={20}
          step={0.1}
          disabled={disabled}
          changed={ch(i0.P0, reference.initial.P0)}
          onChange={(v) => update({ initial: { ...i0, P0: v } })}
          tooltip="Product already present at t = 0, for example carried over with the inoculum."
        />
        <ParameterSlider
          label="Volume"
          symbol="V_{0}"
          unit="L"
          value={i0.V0}
          min={0.5}
          max={20}
          step={0.1}
          disabled={disabled}
          changed={ch(i0.V0, reference.initial.V0)}
          onChange={(v) => update({ initial: { ...i0, V0: v } })}
          tooltip="Working volume of liquid at t = 0."
        />
      </Group>

      <Group title="Growth kinetics" note="Monod">
        <ParameterSlider
          label="Max. growth rate"
          symbol="μ_{max}"
          unit="h⁻¹"
          value={k.muMax}
          min={0.05}
          max={1.5}
          step={0.01}
          disabled={disabled}
          changed={ch(k.muMax, reference.kinetics.muMax)}
          onChange={(v) => update({ kinetics: { ...k, muMax: v } })}
          tooltip="The highest specific growth rate, approached when substrate is far above Ks. Doubling time is ln 2 / μ."
        />
        <ParameterSlider
          label="Half-saturation"
          symbol="K_{s}"
          unit="g/L"
          value={k.Ks}
          min={0.01}
          max={5}
          step={0.01}
          disabled={disabled}
          changed={ch(k.Ks, reference.kinetics.Ks)}
          onChange={(v) => update({ kinetics: { ...k, Ks: v } })}
          tooltip="Substrate concentration at which μ = μmax / 2. A small Ks means the organism grows well even at low substrate."
        />
        <ParameterSlider
          label="Biomass yield"
          symbol="Y_{x/s}"
          unit="g/g"
          value={k.Yxs}
          min={0.05}
          max={1}
          step={0.01}
          disabled={disabled}
          changed={ch(k.Yxs, reference.kinetics.Yxs)}
          onChange={(v) => update({ kinetics: { ...k, Yxs: v } })}
          tooltip="Grams of biomass formed per gram of substrate used for growth."
        />
        <ParameterSlider
          label="Maintenance"
          symbol="m_{s}"
          unit="g/g·h"
          value={k.ms}
          min={0}
          max={0.1}
          step={0.001}
          disabled={disabled}
          changed={ch(k.ms, reference.kinetics.ms)}
          onChange={(v) => update({ kinetics: { ...k, ms: v } })}
          tooltip="Substrate consumed per gram of biomass per hour just to stay alive, independent of growth."
        />
        <ParameterSlider
          label="Death rate"
          symbol="k_{d}"
          unit="h⁻¹"
          value={k.kd}
          min={0}
          max={0.1}
          step={0.001}
          disabled={disabled}
          changed={ch(k.kd, reference.kinetics.kd)}
          onChange={(v) => update({ kinetics: { ...k, kd: v } })}
          tooltip="Fraction of biomass lost to death or decay per hour."
        />
      </Group>

      <Group title="Product formation" note="Luedeking–Piret">
        <ParameterSlider
          label="Growth-associated"
          symbol="α"
          unit="g/g"
          value={k.alpha}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
          changed={ch(k.alpha, reference.kinetics.alpha)}
          onChange={(v) => update({ kinetics: { ...k, alpha: v } })}
          tooltip="Product formed in proportion to growth, as for many primary metabolites."
        />
        <ParameterSlider
          label="Non-growth-associated"
          symbol="β"
          unit="g/g·h"
          value={k.beta}
          min={0}
          max={0.2}
          step={0.005}
          disabled={disabled}
          changed={ch(k.beta, reference.kinetics.beta)}
          onChange={(v) => update({ kinetics: { ...k, beta: v } })}
          tooltip="Product formed per gram of biomass per hour even without growth, as for many secondary metabolites."
        />
        <ParameterSlider
          label="Product yield"
          symbol="Y_{p/s}"
          unit="g/g"
          value={k.Yps}
          min={0.05}
          max={1}
          step={0.01}
          disabled={disabled}
          changed={ch(k.Yps, reference.kinetics.Yps)}
          onChange={(v) => update({ kinetics: { ...k, Yps: v } })}
          tooltip="Grams of product formed per gram of substrate directed to product synthesis."
        />
      </Group>

      <Group title="Run" note="RK4" defaultOpen={false}>
        <ParameterSlider
          label="Duration"
          symbol="t_{end}"
          unit="h"
          value={st.duration}
          min={1}
          max={200}
          step={1}
          disabled={disabled}
          changed={ch(st.duration, reference.settings.duration)}
          onChange={(v) => update({ settings: { ...st, duration: v } })}
          tooltip="Total simulated time."
        />
        <ParameterSlider
          label="Time step"
          symbol="Δt"
          unit="h"
          value={st.dt}
          min={0.005}
          max={0.5}
          step={0.005}
          disabled={disabled}
          changed={ch(st.dt, reference.settings.dt)}
          onChange={(v) => update({ settings: { ...st, dt: v } })}
          tooltip="Integration step of the fourth-order Runge–Kutta solver. Smaller is more accurate."
        />
      </Group>
    </div>
  )
}

// Memoised: the Lab re-renders on every playback tick, this does not need to.
export default memo(ParameterPanel)
