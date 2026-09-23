/**
 * Decorative molecular-network backdrop. Pure SVG + CSS transforms, no JS
 * loop. Two depth layers drift at different rates with scroll and pointer.
 */
const NODES: [number, number, number][] = [
  [60, 90, 5], [180, 40, 3], [260, 130, 6], [130, 200, 4], [340, 210, 3], [420, 90, 5], [520, 170, 3], [610, 60, 6], [700, 150, 4],
  [820, 80, 3], [930, 190, 5], [1040, 70, 4], [1120, 150, 3], [240, 300, 4], [400, 340, 5], [560, 300, 3], [740, 330, 6], [900, 310, 4], [1080, 330, 3],
]
const BONDS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [3, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [10, 17], [6, 15],
]

export default function MolecularField() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMin slice"
        className="absolute left-0 top-0 h-[70%] w-full opacity-60"
        style={{ transform: 'translate3d(calc(var(--px, 0) * -18px), calc(var(--sy, 0) * 0.08px), 0)' }}
      >
        <g stroke="#46e0c8" strokeOpacity="0.16" strokeWidth="1">
          {BONDS.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
          ))}
        </g>
        {NODES.map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={i % 4 === 0 ? '#f0b545' : '#46e0c8'}
            opacity={i % 4 === 0 ? 0.35 : 0.3}
            className="animate-pulse"
            style={{ animationDelay: `${(i % 7) * 0.5}s` }}
          />
        ))}
      </svg>
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ transform: 'translate3d(calc(var(--px, 0) * 30px), calc(var(--sy, 0) * -0.14px), 0)' }}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const x = (i * 179) % 1180
          const y = 120 + ((i * 313) % 640)
          const r = 6 + ((i * 7) % 22)
          return <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#46e0c8" strokeOpacity="0.07" strokeWidth="1.2" />
        })}
      </svg>
    </div>
  )
}
