import type { DerivedMetrics, SimulationResult } from './types'

export function trajectoryToCsv(result: SimulationResult): string {
  const header = 'time_h,biomass_gL,substrate_gL,product_gL,volume_L,growth_rate_hInv'
  const rows = result.points.map(
    (p) =>
      `${p.t.toFixed(4)},${p.X.toFixed(6)},${p.S.toFixed(6)},${p.P.toFixed(6)},${p.V.toFixed(6)},${p.mu.toFixed(6)}`
  )
  return [header, ...rows].join('\n')
}

/** Full experiment record: parameters, summary metrics and trajectory. */
export function experimentToJson(result: SimulationResult, metrics: DerivedMetrics | null, label: string): string {
  return JSON.stringify(
    {
      experiment: label,
      generatedBy: 'Bioreactor Lab (educational model: Monod kinetics, Luedeking-Piret, RK4)',
      units: { time: 'h', concentrations: 'g/L', volume: 'L', growthRate: '1/h' },
      config: result.config,
      metrics,
      trajectory: result.points,
    },
    null,
    2
  )
}

/** e.g. bioreactor_cstr-washout_40h_20260924-1530.csv */
export function exportFilename(label: string, duration: number, ext: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
  return `bioreactor_${slug || 'run'}_${Math.round(duration)}h_${stamp}.${ext}`
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadCsv = (filename: string, csv: string) =>
  downloadBlob(filename, new Blob([csv], { type: 'text/csv;charset=utf-8;' }))

export const downloadJson = (filename: string, json: string) =>
  downloadBlob(filename, new Blob([json], { type: 'application/json;charset=utf-8;' }))
