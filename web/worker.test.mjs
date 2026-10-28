import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

// A stand-in for the two bindings that remembers what it was asked.
const fakeEnv = ({ clickOut = { status: 200, body: { outcome: 'sent', url: 'https://shop.example/dress?size=22' } } } = {}) => {
  const calls = { api: [], assets: [] };
  const env = {
    API: {
      fetch: async (input, init = {}) => {
        const request = new Request(input, init);
        calls.api.push({ path: new URL(request.url).pathname, method: request.method, body: init.body });
        if (new URL(request.url).pathname === '/api/click-outs') {
          return new Response(JSON.stringify(clickOut.body), { status: clickOut.status });
        }
        return new Response('api', { status: 200 });
      },
    },
    ASSETS: {
      fetch: async (request) => {
        const path = new URL(request.url).pathname;
        calls.assets.push(path);
        const known = { '/': 'home', '/privacy': 'privacy', '/app': 'shell', '/404': 'not found' };
        return path in known ? new Response(known[path], { status: path === '/404' ? 404 : 200 }) : new Response('', { status: 404 });
      },
    },
  };
  return { env, calls };
};

const get = (env, path) => worker.fetch(new Request(`https://amaraspick.example${path}`), env);

test('/api and /admin go to the API Worker unchanged', async () => {
  const { env, calls } = fakeEnv();
  for (const path of ['/api/products?uk_size=22', '/admin', '/admin/review']) {
    assert.equal(await (await get(env, path)).text(), 'api');
  }
  assert.deepEqual(calls.api.map((c) => c.path), ['/api/products', '/admin', '/admin/review']);
  assert.deepEqual(calls.assets, []);
});

test('app pages get the app shell', async () => {
  const { env } = fakeEnv();
  for (const path of ['/products', '/products/12', '/shops', '/shops/3', '/login', '/signup', '/saved', '/auth', '/account']) {
    const res = await get(env, path);
    assert.equal(res.status, 200, path);
    assert.equal(await res.text(), 'shell', path);
  }
});

test('pre-built pages and unknown addresses come from the assets', async () => {
  const { env } = fakeEnv();
  assert.equal(await (await get(env, '/privacy')).text(), 'privacy');
  const missing = await get(env, '/nothing-here');
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'not found');
});

test('the old How Yxra makes money address redirects to the new one', async () => {
  const { env } = fakeEnv();
  for (const path of ['/how-yxra-makes-money', '/how-yxra-makes-money/']) {
    const res = await get(env, path);
    assert.equal(res.status, 301, path);
    assert.equal(res.headers.get('Location'), 'https://amaraspick.example/how-amaras-pick-makes-money');
  }
});

test('a Click-out is recorded and redirects to the shop', async () => {
  const { env, calls } = fakeEnv();
  const res = await get(env, '/go/42?size=22');
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('Location'), 'https://shop.example/dress?size=22');
  assert.deepEqual(calls.api[0], {
    path: '/api/click-outs',
    method: 'POST',
    body: JSON.stringify({ product_id: 42, uk_size: 22 }),
  });
});

test('a Click-out with a bad size or id, or a product that is gone, is not found', async () => {
  for (const path of ['/go/42?size=21', '/go/42', '/go/abc?size=22']) {
    const { env, calls } = fakeEnv();
    assert.equal((await get(env, path)).status, 404, path);
    assert.deepEqual(calls.api, [], path);
  }
  const { env } = fakeEnv({ clickOut: { status: 404, body: { error: 'gone' } } });
  assert.equal((await get(env, '/go/42?size=22')).status, 404);
});

// A stand-in for Cloudflare's edge cache (caches.default) that keeps what it is given.
const fakeCache = () => {
  const stored = new Map();
  return {
    stored,
    match: async (request) => stored.get(new Request(request).url)?.clone(),
    put: async (request, response) => {
      stored.set(new Request(request).url, response.clone());
    },
  };
};

const withCache = async (fn) => {
  const cache = fakeCache();
  globalThis.caches = { default: cache };
  try {
    return await fn(cache);
  } finally {
    delete globalThis.caches;
  }
};

// The work to finish after the reply, as the Workers runtime does.
const fakeCtx = () => {
  const pending = [];
  return { pending, waitUntil: (promise) => pending.push(promise) };
};

const getWith = async (env, path, ctx = fakeCtx()) => {
  const res = await worker.fetch(new Request(`https://amaraspick.example${path}`), env, ctx);
  await Promise.all(ctx.pending);
  return res;
};

test('the product list, shop list and categories are kept for 10 minutes, so the API is asked once', async () => {
  await withCache(async () => {
    const { env, calls } = fakeEnv();
    for (const path of ['/api/products', '/api/products?category=swimwear', '/api/retailers', '/api/categories']) {
      const first = await getWith(env, path);
      assert.equal(await first.text(), 'api', path);
      assert.equal(first.headers.get('Cache-Control'), 'public, max-age=600', path);
      const second = await getWith(env, path);
      assert.equal(await second.text(), 'api', path);
    }
    assert.deepEqual(calls.api.map((c) => c.path), ['/api/products', '/api/products', '/api/retailers', '/api/categories']);
  });
});

test('each search is kept separately', async () => {
  await withCache(async () => {
    const { env, calls } = fakeEnv();
    await getWith(env, '/api/products?uk_size=20');
    await getWith(env, '/api/products?uk_size=22');
    await getWith(env, '/api/products?uk_size=20');
    assert.equal(calls.api.length, 2);
  });
});

test('a failed answer is not kept', async () => {
  await withCache(async (cache) => {
    const { env } = fakeEnv();
    env.API.fetch = async () => new Response('down', { status: 500 });
    assert.equal((await getWith(env, '/api/products')).status, 500);
    assert.equal(cache.stored.size, 0);
  });
});

test('Saved products, single products, Click-outs and the admin are never kept', async () => {
  await withCache(async (cache) => {
    const { env, calls } = fakeEnv();
    for (const path of ['/api/products?ids=1,2', '/api/products/12', '/admin', '/api/review']) {
      await getWith(env, path);
      await getWith(env, path);
    }
    await worker.fetch(new Request('https://amaraspick.example/api/retailers', { method: 'POST', body: '{}' }), env, fakeCtx());
    assert.equal(cache.stored.size, 0);
    assert.equal(calls.api.length, 9);
  });
});

test('without an edge cache (local dev) the list still comes from the API', async () => {
  const { env, calls } = fakeEnv();
  assert.equal(await (await getWith(env, '/api/products')).text(), 'api');
  assert.equal(calls.api.length, 1);
});
