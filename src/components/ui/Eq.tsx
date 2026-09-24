import { renderMath } from './mathText'

export function Eq({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  return <span className={`math ${block ? 'block text-[1.18rem] leading-[1.7] sm:text-[1.3rem]' : ''} ${className}`}>{renderMath(children)}</span>
}

/**
 * Display equation(s), set like a journal: centred on the measure with an
 * optional equation number in the right margin.
 */
export function EquationBlock({ lines, label, number, className = '' }: { lines: string[]; label?: string; number?: string | number; accent?: string; className?: string }) {
  return (
    <div className={`relative my-5 flex items-center gap-4 border-y border-line py-4 ${className}`} role="group" aria-label={label ?? 'Equation'}>
      <div className="min-w-0 flex-1 overflow-x-auto px-1 text-ink sm:px-6">
        {lines.map((l, i) => (
          <Eq key={i} block>
            {l}
          </Eq>
        ))}
      </div>
      {number !== undefined && <span className="shrink-0 font-mono text-label text-ink-3">({number})</span>}
    </div>
  )
}
