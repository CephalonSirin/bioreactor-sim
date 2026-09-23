import type { ReactorType } from '../../simulation/types'

/** Small schematic of a reactor mode showing what flows in and out. */
export default function ReactorGlyph({ type, className }: { type: ReactorType; className?: string }) {
  const liquid = type === 'fedbatch' ? 0.42 : 0.6
  const top = 70 - liquid * 44
  return (
    <svg viewBox="0 0 120 96" className={className} aria-hidden="true">
      <path d="M40 24 V64 Q40 72 48 72 H72 Q80 72 80 64 V24 Z" fill="none" stroke="rgba(190,240,232,0.7)" strokeWidth="1.8" />
      <clipPath id={`g-${type}`}>
        <path d="M41 24 V64 Q41 71 48 71 H72 Q79 71 79 64 V24 Z" />
      </clipPath>
      <g clipPath={`url(#g-${type})`}>
        <rect x="40" y={top + 26} width="40" height="60" fill="#f0b545" opacity="0.42" />
      </g>
      {type === 'fedbatch' && <rect x="41" y={top + 26} width="38" height="46" fill="#f0b545" opacity="0.15" clipPath={`url(#g-${type})`} />}
      <line x1="60" y1="18" x2="60" y2="62" stroke="#93a9a9" strokeWidth="1.6" />
      <rect x="50" y="56" width="20" height="4" rx="1" fill="#b7c9c8" />
      <rect x="37" y="20" width="46" height="5" rx="2" fill="#3d5557" />
      {type !== 'batch' && (
        <g stroke="#46e0c8" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M6 12 H54 V30" />
          <path d="M50 26 l4 5 l4 -5" fill="#46e0c8" stroke="none" />
        </g>
      )}
      {type === 'cstr' && (
        <g stroke="#f0b545" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M80 40 H108 V64" />
          <path d="M104 60 l4 5 l4 -5" fill="#f0b545" stroke="none" />
        </g>
      )}
      {type === 'batch' && <text x="60" y="12" textAnchor="middle" fontSize="8" fill="#6b8183" fontFamily="IBM Plex Mono, monospace">closed</text>}
    </svg>
  )
}
