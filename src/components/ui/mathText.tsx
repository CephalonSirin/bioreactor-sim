import type { ReactNode } from 'react'

/**
 * Renders lightweight math markup: `_{...}` becomes a subscript and
 * `^{...}` a superscript; everything else is set in an italic serif face.
 *   <Eq>{'μ = μ_{max} S / (K_{s} + S)'}</Eq>
 */
export function renderMath(src: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /([_^])\{([^}]*)\}/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index))
    out.push(m[1] === '_' ? <sub key={i++}>{m[2]}</sub> : <sup key={i++}>{m[2]}</sup>)
    last = m.index + m[0].length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}
