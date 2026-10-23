const db = require("../db/connection");
const { SMALLEST_PLUS_UK_SIZE, SMALLEST_PLUS_BRA_BAND } = require("../lib/sorting");
const { CUPS } = require("../lib/sizes");

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

// A Size label covering UK 18 or above (for a bra, band 38 or above), the
// same line as isPlusSize; PLUS_IN_STOCK adds translated and in stock today.
const PLUS = (s) =>
  `(${SMALLEST_PLUS_UK_SIZE} <= ANY (${s}.uk_sizes) OR ${s}.bra_band >= ${SMALLEST_PLUS_BRA_BAND})`;
const PLUS_IN_STOCK = (s) => `${s}.size_status = 'translated' AND ${s}.in_stock AND ${PLUS(s)}`;

// Every in-stock plus Size label of the Product: UK sizes ascending, then
// bands, then cups.
const IN_STOCK_SIZES = `ARRAY(
  SELECT i.size_label FROM product_sizes i
  WHERE i.product_id = found.product_id AND ${PLUS_IN_STOCK("i")}
  ORDER BY cardinality(i.uk_sizes) = 0, i.uk_sizes, i.bra_band,
           array_position($9::text[], i.bra_cup), i.size_label)`;

// Products in stock in one UK size (or for bras, one band, optionally one
// cup), optionally in one category. When several of a Product's Size labels
// cover the size, the narrowest one is shown. With no size (she has not
// picked one yet), Products in stock in at least one plus size, with no
// size_label or fits. Every result lists its in_stock_sizes. With priceNear,
// the closest prices come first (used for "similar"). Otherwise Retailers
// take turns, in an order picked at random for each search, so one
// Retailer's Products are not all together.
exports.searchProducts = async ({
  ukSize = null,
  braBand = null,
  braCup = null,
  category,
  excludeProductId = null,
  priceNear = null,
  limit = 500,
}) => {
  const browsing = ukSize === null && braBand === null;
  const { rows } = await db.query(
    `SELECT found.*, ${IN_STOCK_SIZES} AS in_stock_sizes FROM (
       SELECT DISTINCT ON (p.product_id)
         p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
         p.price_in_pence, p.last_checked_at, p.first_seen_at, p.retailer_id, r.retailer_name,
         s.size_label, s.uk_sizes, s.bra_band, s.bra_cup
       FROM products p
       JOIN retailers r USING (retailer_id)
       JOIN product_sizes s USING (product_id)
       WHERE ${SHOPPABLE}
         AND s.size_status = 'translated' AND s.in_stock
         AND CASE WHEN $1::int IS NULL AND $6::int IS NULL THEN ${PLUS("s")}
                  ELSE $1::int = ANY (s.uk_sizes)
                       OR (s.bra_band = $6::int AND ($7::text IS NULL OR s.bra_cup = $7::text))
             END
         AND ($2::text IS NULL OR p.category = $2)
         AND ($3::int IS NULL OR p.product_id <> $3)
       ORDER BY p.product_id, cardinality(s.uk_sizes), s.size_label
     ) found
     ORDER BY CASE WHEN $4::int IS NULL THEN 0 ELSE ABS(price_in_pence - $4::int) END,
              row_number() OVER (PARTITION BY retailer_id ORDER BY random()),
              md5(retailer_id || $8::text)
     LIMIT $5`,
    [ukSize, category || null, excludeProductId, priceNear, limit, braBand, braCup, Math.random(), CUPS]
  );
  return rows.map(({ uk_sizes, first_seen_at, bra_band, bra_cup, size_label, ...row }) => ({
    ...row,
    size_label: browsing ? null : size_label,
    fits: browsing ? null : fitsRange(uk_sizes),
  }));
};
