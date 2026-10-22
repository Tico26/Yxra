// What the Shopper is searching for, read from the page address, and the
// addresses and API queries built from it. She filters by category and UK
// size. With no size she browses everything in stock in a plus size.
import { CATEGORIES, parseCategory, parseSize } from "./format.mjs";

// From the home page's ?size= and ?category=.
export const readSearch = (params = {}) => ({
  category: parseCategory(params.category),
  size: parseSize(params.size),
});

// Whether she has chosen a UK size.
export const isSearching = (search) => Boolean(search.size);

// Whether she has narrowed anything: a size or a category.
export const isFiltered = (search) => isSearching(search) || Boolean(search.category);

// The query for GET /api/products: her size and category, or just the
// category (or "") to browse everything in stock in a plus size.
export const productsQuery = (search) => {
  const query = new URLSearchParams();
  if (search.size) query.set("uk_size", String(search.size));
  if (search.category) query.set("category", search.category);
  return query.toString();
};

// The home page address for the search with some filters changed, e.g.
// filterHref(search, { size: 22 }). Lands on the products, under the hero.
export const filterHref = (search, change = {}, hash = "products") => {
  const next = { ...search, ...change };
  const query = new URLSearchParams();
  if (next.category) query.set("category", next.category);
  if (next.size) query.set("size", String(next.size));
  const q = query.toString();
  return `/${q ? `?${q}` : ""}#${hash}`;
};

// The filter panel's one-line summary on phones: "Swimwear, UK 22".
export const filterSummary = (search) => {
  const parts = [];
  if (search.category) parts.push(CATEGORIES.find((c) => c.value === search.category).label);
  if (search.size) parts.push(`UK ${search.size}`);
  return parts.join(", ");
};

// "a 20".
export const inSize = (search) => `a ${search.size}`;

// The Click-out link for one UK size: /go/<id>?size=20.
export const goHrefFor = (productId, size) => `/go/${productId}?${new URLSearchParams({ size: String(size) })}`;

// One of the API's in_stock_sizes labels as a UK size to click out with, or
// null. "20" is exact. A shop's own label such as "UK 22-24" or "XL (Approx
// 16-18)" gives the first plus UK size in it (22, 18), which the Click-out
// matches to that size on the shop. "XXL" gives none.
export const labelSize = (label) => {
  const text = String(label ?? "").trim();
  if (/^\d+$/.test(text)) return parseSize(text);
  return (text.match(/\d+/g) || []).map(parseSize).find(Boolean) ?? null;
};

// The plus sizes a Product is in stock in, from the API's in_stock_sizes, in
// the API's order, each with its Click-out link (null if the label names no
// size we can send): [{ label: "20", href: "/go/3?size=20" }].
export const stockSizes = (product) =>
  (Array.isArray(product?.in_stock_sizes) ? product.in_stock_sizes : [])
    .filter((label) => String(label ?? "").trim())
    .map((label) => {
      const size = labelSize(label);
      return { label: String(label).trim(), href: size ? goHrefFor(product.product_id, size) : null };
    });

// The Click-out link for a card: in her size, or with no size chosen, in the
// first plus size the Product is in stock in. Null if there is none.
export const goHref = (search, product) => {
  if (!isSearching(search)) return stockSizes(product).find((s) => s.href)?.href ?? null;
  return goHrefFor(product.product_id, search.size);
};

// What the results count calls what she found: "1 item", "12 swimwear".
export const resultsWord = (search, count) => {
  if (count === 1 || !search.category) return count === 1 ? "item" : "items";
  return search.category;
};
