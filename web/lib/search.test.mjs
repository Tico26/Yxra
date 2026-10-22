import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readSearch,
  isSearching,
  isFiltered,
  productsQuery,
  filterHref,
  filterSummary,
  labelSize,
  stockSizes,
  inSize,
  goHref,
  resultsWord,
} from "./search.mjs";

test("a UK size search asks the API for that size and category only", () => {
  const search = readSearch({ size: "22", category: "swimwear" });
  assert.deepEqual(search, { category: "swimwear", size: 22 });
  assert.equal(productsQuery(search), "uk_size=22&category=swimwear");
  assert.equal(productsQuery(readSearch({ size: "22" })), "uk_size=22");
});

test("with no size she browses: no uk_size is sent", () => {
  assert.equal(productsQuery(readSearch({})), "");
  assert.equal(isSearching(readSearch({})), false);
  assert.equal(isFiltered(readSearch({})), false);
  assert.equal(productsQuery(readSearch({ category: "swimwear" })), "category=swimwear");
  assert.equal(isFiltered(readSearch({ category: "swimwear" })), true);
  assert.equal(productsQuery(readSearch({ category: "hats", size: "19" })), "");
});

test("filter links change one thing and land on the products", () => {
  const none = readSearch({});
  assert.equal(filterHref(none), "/#products");
  assert.equal(filterHref(none, { category: "swimwear" }), "/?category=swimwear#products");
  assert.equal(filterHref(none, { size: 22 }), "/?size=22#products");
  const swim22 = readSearch({ category: "swimwear", size: "22" });
  assert.equal(filterHref(swim22, { category: "clothes" }), "/?category=clothes&size=22#products");
  assert.equal(filterHref(swim22, { size: null }), "/?category=swimwear#products");
  assert.equal(filterHref(swim22, { category: "" }), "/?size=22#products");
  // Every filter link reads back as what it says.
  assert.deepEqual(readSearch(Object.fromEntries(new URLSearchParams("category=swimwear&size=22"))), swim22);
});

test("the filter summary names what is picked", () => {
  assert.equal(filterSummary(readSearch({})), "");
  assert.equal(filterSummary(readSearch({ category: "swimwear", size: "22" })), "Swimwear, UK 22");
  assert.equal(filterSummary(readSearch({ size: "20" })), "UK 20");
  assert.equal(filterSummary(readSearch({ category: "activewear" })), "Activewear");
});

test("in-stock size labels read as a UK size", () => {
  assert.equal(labelSize("20"), 20);
  assert.equal(labelSize("UK 22-24"), 22);
  assert.equal(labelSize("XL (Approx 16-18)"), 18);
  assert.equal(labelSize("18-20"), 18);
  assert.equal(labelSize("XXL"), null);
  assert.equal(labelSize("3XL"), null);
  assert.equal(labelSize("19"), null);
  assert.equal(labelSize(null), null);
});

test("with no size chosen, cards list the plus sizes in stock and link out in each", () => {
  const product = { product_id: 9, in_stock_sizes: ["18", "20", "XXL", "UK 22-24", ""] };
  assert.deepEqual(stockSizes(product), [
    { label: "18", href: "/go/9?size=18" },
    { label: "20", href: "/go/9?size=20" },
    { label: "XXL", href: null },
    { label: "UK 22-24", href: "/go/9?size=22" },
  ]);
  assert.deepEqual(stockSizes({ product_id: 9 }), []);
  // The card itself links out in the first plus size in stock.
  assert.equal(goHref(readSearch({}), product), "/go/9?size=18");
  assert.equal(goHref(readSearch({}), { product_id: 4, in_stock_sizes: ["XXL", "2XL (Approx 18-20)"] }), "/go/4?size=18");
  assert.equal(goHref(readSearch({}), { product_id: 4, in_stock_sizes: ["XXL"] }), null);
  assert.equal(goHref(readSearch({}), { product_id: 4 }), null);
});

test("the searched size reads naturally", () => {
  assert.equal(inSize(readSearch({ size: "24" })), "a 24");
});

test("card links go through the Click-out with her size", () => {
  assert.equal(goHref(readSearch({ size: "20" }), { product_id: 3 }), "/go/3?size=20");
  assert.equal(goHref(readSearch({ size: "20" }), { product_id: 3, in_stock_sizes: ["18", "20"] }), "/go/3?size=20");
});

test("the results count names what she found", () => {
  assert.equal(resultsWord(readSearch({}), 3), "items");
  assert.equal(resultsWord(readSearch({ size: "20", category: "swimwear" }), 3), "swimwear");
  assert.equal(resultsWord(readSearch({ size: "20" }), 3), "items");
  assert.equal(resultsWord(readSearch({ size: "20", category: "clothes" }), 1), "item");
});
