/** Rounds an axis maximum up to a friendly number and returns tick values. */
export function niceAxis(max: number, target = 5): { max: number; ticks: number[] } {
  const safe = Number.isFinite(max) && max > 0 ? max : 1
  const raw = safe / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const frac = raw / pow
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow
  const top = Math.ceil(safe / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(10)))
  return { max: top, ticks }
}
