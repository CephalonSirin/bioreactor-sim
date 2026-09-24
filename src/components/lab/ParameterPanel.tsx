import { memo } from 'react'
import ParameterSlider from './ParameterSlider'
import { criticalDilutionRate } from '../../simulation/kinetics'
import type { ReactorConfig } from '../../simulation/types'

interface ParameterPanelProps {
  config: ReactorConfig
  onChange: (config: ReactorConfig) => void
  disabled?: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b border-ink-600/70 py-1 last:border-b-0">
      <summary className="flex cursor-pointer items-center justify-between py-2 font-display text-[13px] font-semibold text-paper">
        {title}
        <span className="text-muted transition-transform duration-200 group-open:rotate-90" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  )
}

function CriticalHint({ config }: { config: ReactorConfig }) {
  const dCrit = criticalDilutionRate(config.cstr.Sf, config.kinetics)
  const washout = config.cstr.D >= dCrit
  return (
    <p
      className={`my-1 rounded border px-2.5 py-1.5 font-mono text-[11px] ${
        washout ? 'border-readout-product/60 bg-readout-product/10 text-readout-product' : 'border-aqua/30 bg-aqua/5 text-aqua'
      }`}
    >
      D_crit = {dCrit.toFixed(3)} h⁻¹ · {washout ? 'D ≥ D_crit → washout' : 'D < D_crit → stable'}
    </p>
  )
}

function ParameterPanel({ config, onChange, disabled }: ParameterPanelProps) {
  const update = (patch: Partial<ReactorConfig>) => onChange({ ...config, ...patch })

  return (
    <div className="glass flex flex-col p-4">
      <Section title="Initial conditions">
        <ParameterSlider
          label="Initial biomass"
          symbol="X₀"
          unit="g/L"
          value={config.initial.X0}
          min={0.01}
          max={5}
          step={0.01}
          accent="#e0a940"
          disabled={disabled}
          onChange={(v) => update({ initial: { ...config.initial, X0: v } })}
          tooltip="The starting concentration of cells (biomass) in the vessel, before any growth has occurred."
        />
        <ParameterSlider
          label="Initial substrate"
          symbol="S₀"
          unit="g/L"
          value={config.initial.S0}
          min={0}
          max={50}
          step={0.1}
          accent="#4fb8ae"
          disabled={disabled}
          onChange={(v) => update({ initial: { ...config.initial, S0: v } })}
          tooltip="The starting concentration of limiting substrate (e.g. glucose) — the 'food' that drives growth."
        />
        <ParameterSlider
          label="Initial volume"
          symbol="V₀"
          unit="L"
          value={config.initial.V0}
          min={0.5}
          max={20}
          step={0.1}
          accent="#8b9dc9"
          disabled={disabled}
          onChange={(v) => update({ initial: { ...config.initial, V0: v } })}
          tooltip="The starting working volume of liquid in the reactor vessel."
        />
      </Section>

      <Section title="Growth &amp; product kinetics">
        <ParameterSlider
          label="Max specific growth rate"
          symbol="μmax"
          unit="1/h"
          value={config.kinetics.muMax}
          min={0.05}
          max={1.5}
          step={0.01}
          accent="#8fb996"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, muMax: v } })}
          tooltip="The fastest possible growth rate the culture can achieve, reached when substrate is far in excess of Ks."
        />
        <ParameterSlider
          label="Monod constant"
          symbol="Ks"
          unit="g/L"
          value={config.kinetics.Ks}
          min={0.01}
          max={5}
          step={0.01}
          accent="#4fb8ae"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, Ks: v } })}
          tooltip="The substrate concentration at which growth rate is exactly half of mu_max. A small Ks means the organism is efficient even at low substrate levels."
        />
        <ParameterSlider
          label="Biomass yield on substrate"
          symbol="Yxs"
          unit="g/g"
          value={config.kinetics.Yxs}
          min={0.05}
          max={1}
          step={0.01}
          accent="#e0a940"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, Yxs: v } })}
          tooltip="Grams of biomass produced per gram of substrate consumed for growth."
        />
        <ParameterSlider
          label="Product yield on substrate"
          symbol="Yps"
          unit="g/g"
          value={config.kinetics.Yps}
          min={0.05}
          max={1}
          step={0.01}
          accent="#e0785a"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, Yps: v } })}
          tooltip="Grams of product formed per gram of substrate directed toward product synthesis."
        />
        <ParameterSlider
          label="Growth-associated product coeff."
          symbol="α"
          unit="g/g"
          value={config.kinetics.alpha}
          min={0}
          max={1}
          step={0.01}
          accent="#e0785a"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, alpha: v } })}
          tooltip="Luedeking–Piret coefficient: product formed in direct proportion to growth rate (e.g. primary metabolites)."
        />
        <ParameterSlider
          label="Non-growth-associated product coeff."
          symbol="β"
          unit="1/h"
          value={config.kinetics.beta}
          min={0}
          max={0.2}
          step={0.005}
          accent="#e0785a"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, beta: v } })}
          tooltip="Luedeking–Piret coefficient: product formed proportional to biomass present, even without active growth (e.g. secondary metabolites)."
        />
        <ParameterSlider
          label="Maintenance coefficient"
          symbol="ms"
          unit="g/g/h"
          value={config.kinetics.ms}
          min={0}
          max={0.1}
          step={0.001}
          accent="#546366"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, ms: v } })}
          tooltip="Substrate consumed for cell maintenance (non-growth functions), independent of growth."
        />
        <ParameterSlider
          label="Death / decay rate"
          symbol="kd"
          unit="1/h"
          value={config.kinetics.kd}
          min={0}
          max={0.1}
          step={0.001}
          accent="#546366"
          disabled={disabled}
          onChange={(v) => update({ kinetics: { ...config.kinetics, kd: v } })}
          tooltip="The rate at which cells die or lose viability, independent of growth."
        />
      </Section>

      {config.reactorType === 'fedbatch' && (
        <Section title="Feed settings">
          <ParameterSlider
            label="Feed flow rate"
            symbol="F"
            unit="L/h"
            value={config.fedBatch.F}
            min={0}
            max={0.5}
            step={0.005}
            accent="#4fb8ae"
            disabled={disabled}
            onChange={(v) => update({ fedBatch: { ...config.fedBatch, F: v } })}
            tooltip="Volumetric rate at which fresh feed is pumped into the vessel. Zero feed rate reduces this to a batch reactor."
          />
          <ParameterSlider
            label="Feed substrate concentration"
            symbol="Sf"
            unit="g/L"
            value={config.fedBatch.Sf}
            min={1}
            max={300}
            step={1}
            accent="#4fb8ae"
            disabled={disabled}
            onChange={(v) => update({ fedBatch: { ...config.fedBatch, Sf: v } })}
            tooltip="Substrate concentration in the feed stream, typically much higher than the vessel concentration."
          />
        </Section>
      )}

      {config.reactorType === 'cstr' && (
        <Section title="Continuous operation">
          <ParameterSlider
            label="Dilution rate"
            symbol="D"
            unit="1/h"
            value={config.cstr.D}
            min={0.01}
            max={1}
            step={0.005}
            accent="#8b9dc9"
            disabled={disabled}
            onChange={(v) => update({ cstr: { ...config.cstr, D: v } })}
            tooltip="D = F/V, the flow rate through the vessel divided by its volume. Too high a dilution rate washes cells out faster than they can grow."
          />
          <CriticalHint config={config} />
          <ParameterSlider
            label="Feed substrate concentration"
            symbol="Sf"
            unit="g/L"
            value={config.cstr.Sf}
            min={1}
            max={100}
            step={1}
            accent="#4fb8ae"
            disabled={disabled}
            onChange={(v) => update({ cstr: { ...config.cstr, Sf: v } })}
            tooltip="Substrate concentration in the continuous feed stream entering the vessel."
          />
        </Section>
      )}

      <Section title="Run settings">
        <ParameterSlider
          label="Simulation duration"
          symbol="t"
          unit="h"
          value={config.settings.duration}
          min={1}
          max={200}
          step={1}
          accent="#eee9df"
          disabled={disabled}
          onChange={(v) => update({ settings: { ...config.settings, duration: v } })}
          tooltip="Total simulated time span, in hours."
        />
        <ParameterSlider
          label="Integration time step"
          symbol="Δt"
          unit="h"
          value={config.settings.dt}
          min={0.005}
          max={0.5}
          step={0.005}
          accent="#546366"
          disabled={disabled}
          onChange={(v) => update({ settings: { ...config.settings, dt: v } })}
          tooltip="The numerical time step used by the RK4 solver. Smaller steps are more accurate but produce more data points."
        />
      </Section>
    </div>
  )
}

// Memoised: the Lab re-renders on every playback tick, this does not need to.
export default memo(ParameterPanel)
