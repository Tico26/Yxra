import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Only these public settings reach the browser, under the names
  // .github/workflows/deploy.yml already sets (see src/site.js). Never add a
  // secret here: everything listed ends up in the built pages.
  envPrefix: ['VITE_', 'YXRA_SITE_URL', 'YXRA_CONTACT_EMAIL', 'YXRA_TRADER_NAME', 'YXRA_TRADER_ADDRESS'],
  // `npm run dev` only. On Cloudflare, worker.js sends /api to the API Worker.
  server: {
    proxy: {
      '/api': 'http://localhost:9090',
    },
  },
})
