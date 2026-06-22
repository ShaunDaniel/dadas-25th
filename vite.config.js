import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// Resolve the guest encryption key: env var first, then local .guest-key file
function resolveGuestSecret() {
  if (process.env.GUEST_SECRET) return process.env.GUEST_SECRET
  try {
    return fs.readFileSync('.guest-key', 'utf-8').trim()
  } catch {
    return ''
  }
}

// For a USER/ORG page (dadas25th.github.io) keep base '/'.
// For a PROJECT page (dadas25th.github.io/dada/) set base '/dada/'
// and set pathSegmentsToKeep = 1 in public/404.html.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_GUEST_SECRET': JSON.stringify(resolveGuestSecret()),
  },
})
