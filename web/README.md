# Yxra website

Next.js site where a Shopper picks her UK size and a category and sees only
Products in stock in that size at the nightly Stock check. With no size she
sees everything in stock in a plus size, each card listing the sizes in stock.
Choosing one goes through `/go/<id>?size=<n>`, which records the Click-out and
sends her to the Retailer's page in her size (no Live check, ADR 0006). Reading
the page address and building API queries and links lives in `lib/search.mjs`,
tested by `npm test`. The footer
links to the pages spec 0002 rule 26 asks for; who runs Yxra and the contact
email come from `lib/site.mjs`.

## Run locally

```sh
# in the repo root: the API on port 9090
npm start
# here
npm install
YXRA_API_URL=http://localhost:9090 npm run dev
```

## On Cloudflare Workers

The site runs as the `yxra-web` Worker, built with OpenNext, and reaches the
`yxra-api` Worker (the Express API, `api-worker.mjs` in the repo root) through
a service binding. `.github/workflows/deploy.yml` deploys both on every push
to `main`; it lists the repository settings it needs.

To try the Workers locally against a local Postgres:

```sh
# in the repo root
npx wrangler dev --port 8787
# here, in a second terminal
npm run cf:build && npx wrangler dev --port 8788
```
