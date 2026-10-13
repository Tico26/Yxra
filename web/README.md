# Yxra website

Next.js site where a Shopper picks her UK size and a category and sees only
Products in stock in that size. Choosing one goes through `/go/<id>?size=<n>`,
which runs the Live check through the API and either sends her to the
Retailer or shows "Just sold out in <size>" with similar Products.

## Run locally

```sh
# in the repo root: the API on port 9090
npm start
# here
npm install
YXRA_API_URL=http://localhost:9090 npm run dev
```

## Deploy on Vercel

Create a Vercel project from this repo with **Root Directory** set to `web`
and one environment variable, `YXRA_API_URL`, pointing at the Express API.
Every pull request then gets its own preview URL.
