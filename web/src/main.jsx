import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// The site's fonts, served from Amara's Pick itself (no Google Fonts): Albert Sans and
// Bodoni Moda as variable fonts (Bodoni with its optical-size axis), GFS Didot
// for the logo.
import '@fontsource-variable/albert-sans/wght.css'
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource/gfs-didot/400.css'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Pre-built pages (scripts/prerender.mjs) arrive with their HTML already in
// #root, so React takes it over; every other page starts empty.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
