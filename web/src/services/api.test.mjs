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
