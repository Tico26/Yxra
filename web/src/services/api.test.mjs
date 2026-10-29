import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api } from './api.js';

// A stand-in for the browser's fetch that remembers each address asked for.
const fakeFetch = (bodies) => {
  const asked = [];
  globalThis.fetch = async (url) => {
    asked.push(url);
    const path = url.split('?')[0];
    return new Response(JSON.stringify(bodies[url] ?? bodies[path] ?? {}), { status: 200 });
  };
  return asked;
};
afterEach(() => delete globalThis.fetch);

const listed = (overrides) => ({
  product_id: 1,
  retailer_id: 3,
  retailer_name: 'Northern Curve',
  title: 'Wrap Dress',
  price_in_pence: 3500,
  in_stock_sizes: ['18', '20'],
  image_url: 'https://cdn.shopify.com/dress.jpg',
  product_url: 'https://shop.example/dress',
  ...overrides,
});

test('the product list is one request, and each product names its shop by id', async () => {
  const asked = fakeFetch({ '/api/products': { products: [listed(), listed({ product_id: 2, image_url: null })] } });
  const products = await api.getProducts();
  assert.deepEqual(asked, ['/api/products']);
  assert.equal(products.length, 1, 'products without a photo are left out');
  assert.equal(products[0].shop_id, 3);
  assert.equal(products[0].shop_name, 'Northern Curve');
});

test("a shop's page asks only for that shop's products", async () => {
  const asked = fakeFetch({ '/api/products?retailer_id=3': { products: [listed()] } });
  const products = await api.getShopProducts(3);
  assert.deepEqual(asked, ['/api/products?retailer_id=3']);
  assert.equal(products[0].product_name, 'Wrap Dress');
});

test("a shop's products that could not be loaded come back empty", async () => {
  globalThis.fetch = async () => new Response('down', { status: 500 });
  assert.deepEqual(await api.getShopProducts(3), []);
});

// The newsletter band (Newsletter.jsx) posts her address and shows the API's words.
const fakePost = (status, body) => {
  const sent = [];
  globalThis.fetch = async (url, options) => {
    sent.push({ url, method: options.method, headers: options.headers, body: JSON.parse(options.body) });
    return new Response(JSON.stringify(body), { status });
  };
  return sent;
};

test('joining the newsletter posts her address and the hidden field, and passes on the answer', async () => {
  const sent = fakePost(202, { msg: 'Check your email to confirm' });
  const result = await api.joinNewsletter({ email: 'amy@example.com', website: '' });
  assert.deepEqual(sent, [
    {
      url: '/api/newsletter',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'amy@example.com', website: '' },
    },
  ]);
  assert.deepEqual(result, { ok: true, message: 'Check your email to confirm' });
});

test("a turned-down address passes on the API's reason", async () => {
  fakePost(400, { msg: 'Enter a valid email address' });
  assert.deepEqual(await api.joinNewsletter({ email: 'amy' }), { ok: false, message: 'Enter a valid email address' });
});

test('when the API cannot be reached, she is asked to try again later', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  assert.deepEqual(await api.joinNewsletter({ email: 'amy@example.com' }), {
    ok: false,
    message: "Sign-up isn't working right now. Please try again later.",
  });
});

test('a listed product carries its Clothes type', async () => {
  fakeFetch({ '/api/products': { products: [listed({ category: 'clothes', clothes_type: 'dresses' }), listed({ product_id: 2 })] } });
  const [dress, other] = await api.getProducts();
  assert.equal(dress.clothes_type, 'dresses');
  assert.equal(other.clothes_type, null);
});

test('a filter asks the API for its own list', async () => {
  const asked = fakeFetch({ '/api/products': { products: [listed()] } });
  await api.getProducts('?type=jeans');
  assert.deepEqual(asked, ['/api/products?type=jeans']);
});
