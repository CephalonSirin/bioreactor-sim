import { ROUTES, hrefFor } from '../../hooks/useHashRoute'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-600/70">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="font-display text-lg font-semibold">
            Bioreactor<span className="text-aqua"> Lab</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            An interactive teaching laboratory for bioprocess kinetics. Educational, simplified and deterministic: not an industrial process simulator.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {ROUTES.map((r) => (
            <a key={r.id} href={hrefFor(r.id)} className="text-muted transition-colors hover:text-aqua">
              {r.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-ink-700/70 px-4 py-4 text-center font-mono text-[11px] text-dim">
        Monod kinetics · Luedeking–Piret product formation · 4th-order Runge–Kutta · runs entirely in your browser
      </div>
    </footer>
  )
}
