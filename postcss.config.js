import { fileURLToPath } from 'node:url'

// Resolve the Tailwind config relative to this file, not the process cwd,
// so the dev server works no matter where it is launched from.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
}
