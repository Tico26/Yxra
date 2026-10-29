// The product list filters (spec 0005): the nine Clothes types, then the other
// Categories, in the order the filter row shows them. The Clothes types match
// lib/clothes-types.js in the API.
const clothesType = (key, label) => ({ key, label, param: 'type' });
const category = (key, label) => ({ key, label, param: 'category' });

export const PRODUCT_FILTERS = [
  clothesType('dresses', 'Dresses'),
  clothesType('tops', 'Tops'),
  clothesType('knitwear', 'Jumpers & cardigans'),
  clothesType('coats', 'Coats & jackets'),
  clothesType('jeans', 'Jeans'),
  clothesType('trousers', 'Trousers & shorts'),
  clothesType('skirts', 'Skirts'),
  clothesType('jumpsuits', 'Jumpsuits & co-ords'),
  clothesType('nightwear', 'Nightwear & loungewear'),
  category('swimwear', 'Swimwear'),
  category('activewear', 'Activewear'),
  category('lingerie', 'Lingerie'),
];

const byKey = new Map(PRODUCT_FILTERS.map((f) => [f.key, f]));

// "?type=dresses" for Dresses, "" for All.
export const searchFor = (key) => {
  const filter = byKey.get(key);
  return filter ? `?${filter.param}=${filter.key}` : '';
};

// The API takes the same query as the page address.
export const apiQueryFor = searchFor;

// The filter a page address asks for; anything unknown is All.
export const filterFromSearch = (search) => {
  const params = new URLSearchParams(search);
  for (const filter of PRODUCT_FILTERS) {
    if (params.get(filter.param) === filter.key) return filter.key;
  }
  return 'all';
};

// A Clothes Product with no type yet is only under All.
export const matchesFilter = (product, key) => {
  if (key === 'all') return true;
  const filter = byKey.get(key);
  if (!filter) return false;
  return filter.param === 'type' ? product.clothes_type === key : product.category === key;
};

// The filters these products have something for, in filter order.
export const filtersPresent = (products) =>
  PRODUCT_FILTERS.filter((f) => products.some((p) => matchesFilter(p, f.key))).map((f) => f.key);
