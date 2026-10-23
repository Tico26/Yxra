import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { LEGAL_PAGES } from './legal'
import { SITE } from './site'

export { LEGAL_PAGES, SITE }

// Renders one address to HTML for scripts/prerender.mjs.
export const render = (url) =>
  renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
