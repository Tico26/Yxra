// Up to `count` products for a photo collage, the first from each shop in
// list order, so no single shop fills it.
export const pickOnePerShop = (products, count = 4) => {
  const seenShops = new Set();
  const picks = [];
  for (const product of products) {
    if (picks.length === count) break;
    if (seenShops.has(product.shop_name)) continue;
    seenShops.add(product.shop_name);
    picks.push(product);
  }
  return picks;
};
