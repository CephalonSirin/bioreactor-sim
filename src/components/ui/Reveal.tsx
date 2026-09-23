import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}

/** Fades and lifts its children into view when scrolled to. */
export default function Reveal({ children, delay = 0, className = '', as = 'div' }: RevealProps) {
  const ref = useReveal<HTMLDivElement>()
  const Tag = as as 'div'
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ['--reveal-delay' as string]: `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}
