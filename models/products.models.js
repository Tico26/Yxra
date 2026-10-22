const db = require("../db/connection");

const SIZES_JSON = `COALESCE(
  (SELECT json_agg(json_build_object(
     'size_label', s.size_label, 'uk_sizes', s.uk_sizes, 'size_status', s.size_status,
     'bra_band', s.bra_band, 'bra_cup', s.bra_cup,
     'in_stock', s.in_stock, 'last_checked_at', s.last_checked_at)
   ORDER BY s.product_size_id)
   FROM product_sizes s WHERE s.product_id = p.product_id), '[]')`;

exports.fetchProductById = async (productId) => {
  const { rows } = await db.query(
    `SELECT p.*, r.retailer_name, ${SIZES_JSON} AS sizes
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.product_id = $1`,
    [productId]
  );
  return rows[0];
};

// A Product a Shopper may see: its Retailer is current, the rules (or Tico)
// passed it, and it was in its Retailer's data at the last Stock check.
const SHOPPABLE = `r.removed_at IS NULL AND p.sort_status = 'shown' AND p.missing_since IS NULL`;
exports.SHOPPABLE = SHOPPABLE;

const fitsRange = (ukSizes) =>
  ukSizes.length > 1 ? `fits ${Math.min(...ukSizes)}–${Math.max(...ukSizes)}` : null;
exports.fitsRange = fitsRange;

// Products in stock in one UK size (or for bras, one band, optionally one
// cup), optionally in one category. When several of a Product's Size labels
// cover the size, the narrowest one is shown. With priceNear, the closest
// prices come first (used for "similar").
exports.searchProducts = async ({
  ukSize = null,
  braBand = null,
  braCup = null,
  category,
  excludeProductId = null,
  priceNear = null,
  limit = 500,
}) => {
  const { rows } = await db.query(
    `SELECT * FROM (
       SELECT DISTINCT ON (p.product_id)
         p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
         p.price_in_pence, p.last_checked_at, p.first_seen_at, r.retailer_name,
         s.size_label, s.uk_sizes, s.bra_band, s.bra_cup
       FROM products p
       JOIN retailers r USING (retailer_id)
       JOIN product_sizes s USING (product_id)
       WHERE ${SHOPPABLE}
         AND s.size_status = 'translated' AND s.in_stock
         AND ($1::int = ANY (s.uk_sizes)
              OR (s.bra_band = $6::int AND ($7::text IS NULL OR s.bra_cup = $7::text)))
         AND ($2::text IS NULL OR p.category = $2)
         AND ($3::int IS NULL OR p.product_id <> $3)
       ORDER BY p.product_id, cardinality(s.uk_sizes), s.size_label
     ) found
     ORDER BY CASE WHEN $4::int IS NULL THEN 0 ELSE ABS(price_in_pence - $4::int) END,
              first_seen_at DESC, product_id
     LIMIT $5`,
    [ukSize, category || null, excludeProductId, priceNear, limit, braBand, braCup]
  );
  return rows.map(({ uk_sizes, first_seen_at, bra_band, bra_cup, ...row }) => ({
    ...row,
    fits: fitsRange(uk_sizes),
  }));
};
