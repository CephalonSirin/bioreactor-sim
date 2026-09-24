import { memo } from 'react'
import { hrefFor } from '../../hooks/useHashRoute'
import Logo from './Logo'

function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo className="h-5 w-5" />
            <span className="text-[15px] font-semibold text-ink">Bioreactor Lab</span>
          </div>
          <p className="mt-3 text-ui leading-relaxed text-ink-3">
            An educational bioprocess simulator. Deterministic, idealised mass balances with a single limiting substrate. Not a model of any industrial process.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="t-label mb-3">Application</p>
          <ul className="space-y-2 text-ui">
            <li><a className="text-ink-2 transition-colors hover:text-ink" href={hrefFor('lab')}>Lab</a></li>
            <li><a className="text-ink-2 transition-colors hover:text-ink" href={hrefFor('experiments')}>Experiments</a></li>
          </ul>
        </nav>
        <nav aria-label="Reference">
          <p className="t-label mb-3">Reference</p>
          <ul className="space-y-2 text-ui">
            <li><a className="text-ink-2 transition-colors hover:text-ink" href={hrefFor('learn')}>Learn</a></li>
            <li><a className="text-ink-2 transition-colors hover:text-ink" href={hrefFor('methodology')}>Methodology</a></li>
            <li><a className="text-ink-2 transition-colors hover:text-ink" href="https://github.com/CephalonSirin/bioreactor-sim">Source on GitHub</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-page px-4 py-4 text-label text-ink-3 sm:px-6">
          Monod growth · Luedeking–Piret product formation · RK4 integration · runs entirely in the browser
        </p>
      </div>
    </footer>
  )
}

export default memo(Footer)
