import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickOnePerShop } from './photos.js';

const product = (product_id, shop_name) => ({ product_id, shop_name, image_url: `https://img.example/${product_id}.jpg` });

test('picks up to four products, each from a different shop', () => {
  const products = [
    product(1, 'Lovedrobe'),
    product(2, 'Lovedrobe'),
    product(3, 'Yours'),
    product(4, 'Evans'),
    product(5, 'Yours'),
    product(6, 'Ulla Popken'),
    product(7, 'Navabi'),
  ];
  assert.deepEqual(pickOnePerShop(products).map((p) => p.product_id), [1, 3, 4, 6]);
});

test('picks nothing when there are no products', () => {
  assert.deepEqual(pickOnePerShop([]), []);
});

test('picks fewer than four when fewer shops have products', () => {
  const picks = pickOnePerShop([product(1, 'Lovedrobe'), product(2, 'Lovedrobe'), product(3, 'Yours')]);
  assert.deepEqual(picks.map((p) => p.product_id), [1, 3]);
});
