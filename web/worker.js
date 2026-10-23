// The yxra-web Worker. Static files from dist/ are served by Cloudflare's
// asset handling; wrangler.jsonc sends only the addresses below here first.
//   /api/*, /admin, /admin/*  -> the yxra-api Worker, through the API binding
//   /go/<id>?size=<n>         -> records the Click-out and redirects to the shop
//   app pages (products, shops, Log in, Sign up) -> the app shell, app.html
// Anything else is a static file, or 404.html with a 404 status.

const SIZES = [18, 20, 22, 24, 26, 28, 30, 32];

const APP_PAGES = [/^\/products\/?$/, /^\/products\/[^/]+\/?$/, /^\/shops\/?$/, /^\/shops\/[^/]+\/?$/, /^\/login\/?$/, /^\/signup\/?$/];

const isApi = (path) => path.startsWith('/api/') || path === '/admin' || path.startsWith('/admin/');

// A static page by its clean address (assets serve /app for app.html).
const asset = (env, request, path, status) =>
  env.ASSETS.fetch(new Request(new URL(path, request.url), { headers: request.headers })).then((res) =>
    status && res.status !== status ? new Response(res.body, { status, headers: res.headers }) : res,
  );

const notFound = (env, request) => asset(env, request, '/404', 404);

// The Click-out, as on the previous site: only a UK size Yxra offers, and a
// numeric product id. The API records it and replies with the shop's URL in
// her size; a product that's gone gets the not-found page.
const goToShop = async (env, request, productId, url) => {
  const size = Number(url.searchParams.get('size'));
  if (!SIZES.includes(size) || !/^\d+$/.test(productId)) return notFound(env, request);
  let result = null;
  try {
    const res = await env.API.fetch('https://yxra-api/api/click-outs', {
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
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (isApi(path)) return env.API.fetch(request);

    const go = path.match(/^\/go\/([^/]+)\/?$/);
    if (go) return goToShop(env, request, go[1], url);

    if (APP_PAGES.some((page) => page.test(path))) return asset(env, request, '/app', 200);

    const res = await env.ASSETS.fetch(request);
    return res.status === 404 ? notFound(env, request) : res;
  },
};
