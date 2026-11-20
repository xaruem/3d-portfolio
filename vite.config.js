import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — сайт работает и на GitHub Pages (xaruem.github.io/repo/), и на своём домене
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
})
