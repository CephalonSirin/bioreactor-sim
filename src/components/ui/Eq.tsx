import { renderMath } from './mathText'

export function Eq({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  return (
    <span
      className={`math ${block ? 'block overflow-x-auto py-1 text-[1.15rem] leading-relaxed sm:text-[1.3rem]' : ''} ${className}`}
    >
      {renderMath(children)}
    </span>
  )
}

/** Block equation card used across Learn and Methodology. */
export function EquationBlock({ lines, accent = '#46e0c8', label }: { lines: string[]; accent?: string; label?: string }) {
  return (
    <div
      className="well my-3 overflow-x-auto border-l-2 px-4 py-3"
      style={{ borderLeftColor: accent }}
      role="group"
      aria-label={label ?? 'Equation'}
    >
      {lines.map((l, i) => (
        <Eq key={i} block>
          {l}
        </Eq>
      ))}
    </div>
  )
}
