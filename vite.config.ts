import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // three.js alone is ~650 kB; it lives in the lazily loaded ReactorCanvas
    // chunk, which is fetched after first paint.
    chunkSizeWarningLimit: 1000,
  },
})
