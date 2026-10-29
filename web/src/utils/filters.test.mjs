import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_FILTERS, filterFromSearch, searchFor, apiQueryFor, matchesFilter, filtersPresent } from './filters.js';

const product = (category, clothes_type = null) => ({ category, clothes_type });

test('rule 10: the filters, in order, after All', () => {
  assert.deepEqual(PRODUCT_FILTERS.map((f) => f.label), [
    'Dresses', 'Tops', 'Jumpers & cardigans', 'Coats & jackets', 'Jeans', 'Trousers & shorts',
    'Skirts', 'Jumpsuits & co-ords', 'Nightwear & loungewear', 'Swimwear', 'Activewear', 'Lingerie',
  ]);
});

test('rule 12: the address carries the filter, and opens with it', () => {
  assert.equal(searchFor('all'), '');
  assert.equal(searchFor('dresses'), '?type=dresses');
  assert.equal(searchFor('swimwear'), '?category=swimwear');
  assert.equal(filterFromSearch('?type=dresses'), 'dresses');
  assert.equal(filterFromSearch('?category=swimwear'), 'swimwear');
  assert.equal(filterFromSearch(''), 'all');
});

test('rule 12: an unknown value opens All', () => {
  assert.equal(filterFromSearch('?type=hats'), 'all');
  assert.equal(filterFromSearch('?category=shoes'), 'all');
  assert.equal(filterFromSearch('?category=clothes'), 'all');
  assert.equal(filterFromSearch('?type=swimwear'), 'all');
});

test('rule 11: each filter asks the API for its own list', () => {
  assert.equal(apiQueryFor('all'), '');
  assert.equal(apiQueryFor('jeans'), '?type=jeans');
  assert.equal(apiQueryFor('lingerie'), '?category=lingerie');
});

test('rule 14: a Product matches its Clothes type or its Category; one without a type only All', () => {
  assert.equal(matchesFilter(product('clothes', 'dresses'), 'dresses'), true);
  assert.equal(matchesFilter(product('clothes', 'dresses'), 'tops'), false);
  assert.equal(matchesFilter(product('swimwear'), 'swimwear'), true);
  assert.equal(matchesFilter(product('clothes'), 'all'), true);
  assert.equal(PRODUCT_FILTERS.some((f) => matchesFilter(product('clothes'), f.key)), false);
});

test('rule 13: a shop offers only the filters it has Products for, in the same order', () => {
  const products = [product('lingerie'), product('clothes', 'jeans'), product('clothes', 'dresses'), product('clothes')];
  assert.deepEqual(filtersPresent(products), ['dresses', 'jeans', 'lingerie']);
});
