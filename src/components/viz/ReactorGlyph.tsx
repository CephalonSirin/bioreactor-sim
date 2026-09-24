import type { ReactorType } from '../../simulation/types'

/**
 * Process schematic of a reactor configuration, drawn like a flow diagram:
 * the vessel in section, the culture level, and the streams that cross
 * the boundary (none, feed only, or feed and effluent).
 */
export default function ReactorGlyph({ type, className = '', title }: { type: ReactorType; className?: string; title?: string }) {
  const level = type === 'fedbatch' ? 20 : 26
  return (
    <svg viewBox="0 0 64 48" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none">
      {/* culture */}
      <path d={`M22.8 ${level} H41.2 V37 a4 4 0 0 1 -4 4 H26.8 a4 4 0 0 1 -4 -4 Z`} fill="#C18A12" opacity="0.28" />
      {type === 'fedbatch' && <path d="M22.8 26 H41.2" stroke="#C18A12" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.8" />}
      <path d={`M22.8 ${level} H41.2`} stroke="#C18A12" strokeWidth="1.3" />
      {/* vessel */}
      <path d="M22 9 V37 a5 5 0 0 0 5 5 H37 a5 5 0 0 0 5 -5 V9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19.5 9 H44.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 5 V33 M28.5 33 H35.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* feed */}
      {type !== 'batch' && (
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5 H26 V14" />
          <path d="M23.5 11.5 L26 14.5 L28.5 11.5" />
        </g>
      )}
      {/* effluent */}
      {type === 'cstr' && (
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M42 30 H55 V42" />
          <path d="M52.5 39.5 L55 42.5 L57.5 39.5" />
        </g>
      )}
    </svg>
  )
}
