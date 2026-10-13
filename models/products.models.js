const db = require("../db/connection");

const SIZES_JSON = `COALESCE(
  (SELECT json_agg(json_build_object(
     'size_label', s.size_label, 'uk_sizes', s.uk_sizes, 'size_status', s.size_status,
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

// Products in stock in one UK size, optionally in one category. When several
// of a Product's Size labels cover the size, the narrowest one is shown.
exports.searchProducts = async ({ ukSize, category, excludeProductId = null }) => {
  const { rows } = await db.query(
    `SELECT * FROM (
       SELECT DISTINCT ON (p.product_id)
         p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
         p.price_in_pence, p.last_checked_at, p.first_seen_at, r.retailer_name,
         s.size_label, s.uk_sizes
       FROM products p
       JOIN retailers r USING (retailer_id)
       JOIN product_sizes s USING (product_id)
       WHERE ${SHOPPABLE}
         AND s.size_status = 'translated' AND s.in_stock AND $1 = ANY (s.uk_sizes)
         AND ($2::text IS NULL OR p.category = $2)
         AND ($3::int IS NULL OR p.product_id <> $3)
       ORDER BY p.product_id, cardinality(s.uk_sizes)
     ) found
     ORDER BY first_seen_at DESC, product_id`,
    [ukSize, category || null, excludeProductId]
  );
  return rows.map(({ uk_sizes, first_seen_at, ...row }) => ({
    ...row,
    fits: fitsRange(uk_sizes),
  }));
};
