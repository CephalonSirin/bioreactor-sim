/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F6F4',
        surface: '#FFFFFF',
        sunken: '#EFEFEC',
        line: { DEFAULT: '#E3E3DF', strong: '#CBCBC5' },
        ink: { DEFAULT: '#17191C', 2: '#4A4F55', 3: '#6B7077', 4: '#9A9EA3' },
        accent: { DEFAULT: '#0E6B63', hover: '#0A5750', soft: '#E4F0EE', line: '#9CC7C1' },
        // Measured quantities. Validated as a colour-blind-safe set (X, S, P
        // share a chart); mu and V always sit on charts of their own.
        series: {
          x: '#C18A12',
          s: '#1F6FA8',
          p: '#B23A5A',
          mu: '#3B8A3E',
          v: '#6A5AB5',
        },
        warn: { DEFAULT: '#8F5200', soft: '#FBF1E0', line: '#E9C88F' },
        danger: { DEFAULT: '#B42318', soft: '#FDEDEB', line: '#F1B5AE' },
        ok: { DEFAULT: '#1D6B45', soft: '#E6F2EB' },
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Red Hat Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        math: ['"STIX Two Text"', 'Cambria', '"Times New Roman"', 'serif'],
      },
      fontSize: {
        micro: ['11px', { lineHeight: '14px' }],
        label: ['12px', { lineHeight: '16px' }],
        ui: ['13px', { lineHeight: '18px' }],
        body: ['15px', { lineHeight: '24px' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        pop: '0 1px 2px rgba(23,25,28,0.05), 0 10px 28px -8px rgba(23,25,28,0.16)',
        lift: '0 1px 2px rgba(23,25,28,0.06), 0 2px 8px -2px rgba(23,25,28,0.08)',
        inset: 'inset 0 1px 2px rgba(23,25,28,0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      maxWidth: {
        page: '1440px',
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
