// The amaras-pick-web Worker. Static files from dist/ are served by Cloudflare's
// asset handling; wrangler.jsonc sends only the addresses below here first.
//   /api/*, /admin, /admin/*  -> the amaras-pick-api Worker, through the API binding;
//                                the product list, shop list and categories are
//                                kept at Cloudflare's edge for 10 minutes
//   /go/<id>?size=<n>         -> records the Click-out and redirects to the shop
//   app pages (products, shops, Saved, Log in, Sign up) -> the app shell, app.html
//   /how-yxra-makes-money     -> a permanent redirect to its new address
// Anything else is a static file, or 404.html with a 404 status.

const SIZES = [18, 20, 22, 24, 26, 28, 30, 32];

const APP_PAGES = [/^\/products\/?$/, /^\/products\/[^/]+\/?$/, /^\/shops\/?$/, /^\/shops\/[^/]+\/?$/, /^\/login\/?$/, /^\/signup\/?$/, /^\/saved\/?$/, /^\/auth\/?$/, /^\/account\/?$/];

// Lists that only change at the nightly Stock check. Working out the product
// list takes the database seconds when it is cold, so each answer (one per
// search) is kept for 10 minutes and shoppers in that time get it at once.
// Saved products (?ids=) and single products stay live.
const CACHE_SECONDS = 600;
const isCachedList = (request, url) =>
  request.method === 'GET' &&
  (url.pathname === '/api/retailers' ||
    url.pathname === '/api/categories' ||
    (url.pathname === '/api/products' && !url.searchParams.has('ids')));

// caches.default is Cloudflare's edge cache; it is missing in local dev.
const fromCache = async (request, ctx, fetchFresh) => {
  const cache = globalThis.caches?.default;
  if (!cache) return fetchFresh();
  const kept = await cache.match(request);
  if (kept) return kept;
  const fresh = await fetchFresh();
  if (fresh.status !== 200) return fresh;
  const res = new Response(fresh.body, fresh);
  res.headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
  const put = cache.put(request, res.clone());
  if (ctx?.waitUntil) ctx.waitUntil(put);
  else await put;
  return res;
};

const isApi = (path) => path.startsWith('/api/') || path === '/admin' || path.startsWith('/admin/');

// A static page by its clean address (assets serve /app for app.html).
const asset = (env, request, path, status) =>
  env.ASSETS.fetch(new Request(new URL(path, request.url), { headers: request.headers })).then((res) =>
    status && res.status !== status ? new Response(res.body, { status, headers: res.headers }) : res,
  );

const notFound = (env, request) => asset(env, request, '/404', 404);

// The Click-out, as on the previous site: only a UK size Amara's Pick offers, and a
// numeric product id. The API records it and replies with the shop's URL in
// her size; a product that's gone gets the not-found page.
const goToShop = async (env, request, productId, url) => {
  const size = Number(url.searchParams.get('size'));
  if (!SIZES.includes(size) || !/^\d+$/.test(productId)) return notFound(env, request);
  let result = null;
  try {
    const res = await env.API.fetch('https://amaras-pick-api/api/click-outs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: Number(productId), uk_size: size }),
    });
    if (res.ok) result = await res.json();
  } catch {
    result = null;
  }
  if (!result || !result.url) return notFound(env, request);
  return new Response(null, { status: 307, headers: { Location: result.url, 'Cache-Control': 'no-store' } });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (isCachedList(request, url)) return fromCache(request, ctx, () => env.API.fetch(request));
    if (isApi(path)) return env.API.fetch(request);

    // The page's address before the rebrand from Yxra, kept working for old links.
    if (/^\/how-yxra-makes-money\/?$/.test(path)) {
      return Response.redirect(new URL('/how-amaras-pick-makes-money', request.url), 301);
    }

    const go = path.match(/^\/go\/([^/]+)\/?$/);
    if (go) return goToShop(env, request, go[1], url);

    if (APP_PAGES.some((page) => page.test(path))) return asset(env, request, '/app', 200);

    const res = await env.ASSETS.fetch(request);
    return res.status === 404 ? notFound(env, request) : res;
  },
};
