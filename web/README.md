# Amara's Pick website

Tico's design (Vite + React, from `old-frontend/` on the old-frontend-manchester
branch), with the Privacy, Terms, Cookies, Contact, How Amara's Pick makes money and
For Retailers pages from the previous site, worded the same.

## Run locally

```sh
# in the repo root: the API on port 9090
npm start
# here: the site on http://localhost:5173, with /api sent to port 9090
npm ci
npm run dev
```

`npm run build` writes `dist/`: the app, plus the home page, the fixed pages
and the not-found page pre-built to HTML by `scripts/prerender.mjs` (so
crawlers see the text), `sitemap.xml` and `robots.txt`. `npm run lint` and
`npm test` (the Worker's routing) are what CI runs.

## Settings

Set at build time, under the names `.github/workflows/deploy.yml` uses. Only
these four reach the browser (`envPrefix` in `vite.config.js`):

- `AMARAS_PICK_SITE_URL`: used in `sitemap.xml` and `robots.txt` (default https://amaraspick.co.uk)
- `AMARAS_PICK_CONTACT_EMAIL`: the contact address (default hello@amaraspick.co.uk)
- `AMARAS_PICK_TRADER_NAME`, `AMARAS_PICK_TRADER_ADDRESS`: who runs Amara's Pick, in the footer and legal pages

## On Cloudflare Workers

The site runs as the `amaras-pick-web` Worker. `wrangler.jsonc` serves `dist/` as
static files and sends these addresses to `worker.js` first:

- `/api/*`, `/admin`: passed to the `amaras-pick-api` Worker through the `API` binding
- `/go/<id>?size=<n>`: records the Click-out and redirects to the shop, as before
- `/products`, `/shops`, `/login`, `/signup` and their sub-pages: the app shell

Anything else is a static file, or the not-found page with a 404.
`npm run cf:dev` builds and runs it locally with `wrangler dev`; the `API`
binding only answers there if a `amaras-pick-api` Worker is running locally too.
