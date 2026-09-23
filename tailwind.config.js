/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050c0e',
          900: '#0a1417',
          800: '#0f1d21',
          700: '#172a30',
          600: '#22393f',
          500: '#34525a',
        },
        aqua: { DEFAULT: '#46e0c8', dim: '#2aa898' },
        readout: {
          biomass: '#f0b545',
          substrate: '#46e0c8',
          product: '#f0805f',
          growth: '#9fd18a',
          volume: '#8fa6e8',
        },
        paper: '#e8eeed',
        muted: '#8ea3a3',
        dim: '#6b8183',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        math: ['"STIX Two Text"', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        glass: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(70,224,200,0.35), 0 0 28px -4px rgba(70,224,200,0.35)',
      },
      keyframes: {
        'page-in': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'rise-in': { from: { opacity: '0', transform: 'translateY(22px)' }, to: { opacity: '1', transform: 'none' } },
        'bubble-rise': {
          '0%': { transform: 'translateY(0) scale(0.6)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '100%': { transform: 'translateY(var(--rise, -180px)) scale(1)', opacity: '0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '25%': { transform: 'translate(var(--dx, 6px), var(--dy, -5px))' },
          '50%': { transform: 'translate(0, var(--dy2, 6px))' },
          '75%': { transform: 'translate(calc(var(--dx, 6px) * -1), var(--dy, -5px))' },
        },
        blade: { '0%, 100%': { transform: 'scaleX(1)' }, '50%': { transform: 'scaleX(0.18)' } },
        flow: { to: { strokeDashoffset: '-24' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulse: { '0%, 100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
      },
      animation: {
        'page-in': 'page-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise-in': 'rise-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 7s ease-in-out infinite',
        pulse: 'pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
