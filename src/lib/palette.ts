/**
 * Colour tokens for code that cannot read Tailwind classes (SVG charts,
 * canvas export, WebGL). Mirrors tailwind.config.js; keep the two in sync.
 */
export const INK = {
  1: '#17191C',
  2: '#4A4F55',
  3: '#6B7077',
  4: '#9A9EA3',
  line: '#E3E3DF',
  lineStrong: '#CBCBC5',
  canvas: '#F6F6F4',
  surface: '#FFFFFF',
  sunken: '#EFEFEC',
} as const

export const ACCENT = '#0E6B63'

/** One colour per simulated quantity, used everywhere that quantity appears. */
export const SERIES = {
  X: '#C18A12',
  S: '#1F6FA8',
  P: '#B23A5A',
  mu: '#3B8A3E',
  V: '#6A5AB5',
} as const

export const STATUS = {
  warn: '#8F5200',
  danger: '#B42318',
  ok: '#1D6B45',
} as const

export const FONT = {
  sans: '"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif',
  mono: '"Red Hat Mono", ui-monospace, monospace',
  math: '"STIX Two Text", Cambria, serif',
} as const
