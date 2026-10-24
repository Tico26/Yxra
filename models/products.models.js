const db = require("../db/connection");
const { SMALLEST_PLUS_UK_SIZE, SMALLEST_PLUS_BRA_BAND } = require("../lib/sorting");
const { CUPS } = require("../lib/sizes");

const SIZES_JSON = `COALESCE(
  (SELECT json_agg(json_build_object(
     'size_label', s.size_label, 'uk_sizes', s.uk_sizes, 'size_status', s.size_status,
     'bra_band', s.bra_band, 'bra_cup', s.bra_cup,
     'in_stock', s.in_stock, 'last_checked_at', r.last_collected_at)
   ORDER BY s.product_size_id)
   FROM product_sizes s WHERE s.product_id = p.product_id), '[]')`;

// A Product and its sizes were checked when its Retailer was last collected
// (ADR 0008); last_checked_at on the rows is only when they were last written.
exports.fetchProductById = async (productId) => {
  const { rows } = await db.query(
    `SELECT p.*, r.retailer_name, r.last_collected_at, ${SIZES_JSON} AS sizes
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.product_id = $1`,
    [productId]
  );
  if (!rows[0]) return undefined;
  const { last_collected_at, ...product } = rows[0];
  return { ...product, last_checked_at: last_collected_at };
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
// bands, then cups. $1 is the list of cups in order.
const IN_STOCK_SIZES = `ARRAY(
  SELECT i.size_label FROM product_sizes i
  WHERE i.product_id = found.product_id AND ${PLUS_IN_STOCK("i")}
  ORDER BY cardinality(i.uk_sizes) = 0, i.uk_sizes, i.bra_band,
           array_position($1::text[], i.bra_cup), i.size_label)`;

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
  const params = [CUPS];
  const param = (value, type) => {
    params.push(value);
    return `$${params.length}::${type}`;
  };
  // A Size label the search is for, written for this kind of search alone so
  // the planner can use the bra band index.
  let sizeWanted;
  if (ukSize !== null) sizeWanted = `${param(ukSize, "int")} = ANY (s.uk_sizes)`;
  else if (braBand !== null) {
    sizeWanted = `s.bra_band = ${param(braBand, "int")}`;
    if (braCup !== null) sizeWanted += ` AND s.bra_cup = ${param(braCup, "text")}`;
  } else sizeWanted = PLUS("s");
  const matches = `s.size_status = 'translated' AND s.in_stock AND ${sizeWanted}`;
  const distance = priceNear === null ? "0" : `ABS(p.price_in_pence - ${param(priceNear, "int")})`;
  const conditions = [SHOPPABLE];
  if (category) conditions.push(`p.category = ${param(category, "text")}`);
  if (excludeProductId !== null) conditions.push(`p.product_id <> ${param(excludeProductId, "int")}`);

  // The shuffle runs over narrow rows (ids and price) only; titles, links and
  // the narrowest matching Size label are read for the Products picked. Every
  // matching Product still takes part, so the results are the same as
  // shuffling the full rows, but the work per search stays small.
  const { rows } = await db.query(
    `WITH shops AS (
       SELECT r.retailer_id, r.removed_at,
         row_number() OVER (ORDER BY md5(r.retailer_id || ${param(String(Math.random()), "text")})) AS shop_order
       FROM retailers r
     ), matched AS (
       SELECT p.product_id, r.shop_order, ${distance} AS distance,
         row_number() OVER (PARTITION BY p.retailer_id ORDER BY random()) AS turn
       FROM products p
       JOIN shops r USING (retailer_id)
       WHERE ${conditions.join(" AND ")}
         AND EXISTS (SELECT 1 FROM product_sizes s WHERE s.product_id = p.product_id AND ${matches})
     ), picked AS (
       SELECT product_id, distance, turn, shop_order
       FROM matched
       ORDER BY distance, turn, shop_order
       LIMIT ${param(limit, "int")}
     )
     SELECT found.*, ${IN_STOCK_SIZES} AS in_stock_sizes FROM (
       SELECT p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
         p.price_in_pence, r.last_collected_at AS last_checked_at, p.retailer_id, r.retailer_name,
         s.size_label, s.uk_sizes, s.bra_band, s.bra_cup,
         picked.distance, picked.turn, picked.shop_order
       FROM picked
       JOIN products p USING (product_id)
       JOIN retailers r USING (retailer_id)
       CROSS JOIN LATERAL (
         SELECT s.size_label, s.uk_sizes, s.bra_band, s.bra_cup FROM product_sizes s
         WHERE s.product_id = p.product_id AND ${matches}
         ORDER BY cardinality(s.uk_sizes), s.size_label
         LIMIT 1
       ) s
     ) found
     ORDER BY found.distance, found.turn, found.shop_order`,
    params
  );
  return rows.map(({ uk_sizes, bra_band, bra_cup, size_label, distance, turn, shop_order, ...row }) => ({
    ...row,
    size_label: browsing ? null : size_label,
    fits: browsing ? null : fitsRange(uk_sizes),
  }));
};
