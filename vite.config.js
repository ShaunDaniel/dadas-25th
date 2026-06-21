import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// For a USER/ORG page (dadas25th.github.io) keep base '/'.
// For a PROJECT page (dadas25th.github.io/dada/) set base '/dada/'
// and set pathSegmentsToKeep = 1 in public/404.html.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
