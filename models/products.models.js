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

// A Product a Shopper may see: its Retailer is current, the rules (or Tico)
// passed it, and it was in its Retailer's data at the last Stock check.
const SHOPPABLE = `r.removed_at IS NULL AND p.sort_status = 'shown' AND p.missing_since IS NULL`;
exports.SHOPPABLE = SHOPPABLE;

// A Product and its sizes were checked when its Retailer was last collected
// (ADR 0008); last_checked_at on the rows is only when they were last written.
// Shoppers only ever get a shoppable one: a Product excluded (menswear, say)
// or not yet settled is not found, even by a direct link.
exports.fetchProductById = async (productId, { shoppableOnly = false } = {}) => {
  const { rows } = await db.query(
    `SELECT p.*, r.retailer_name, r.last_collected_at, ${SIZES_JSON} AS sizes
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.product_id = $1 ${shoppableOnly ? `AND ${SHOPPABLE}` : ""}`,
    [productId]
  );
  if (!rows[0]) return undefined;
  const { last_collected_at, ...product } = rows[0];
  return { ...product, last_checked_at: last_collected_at };
};

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
// cup), optionally in one category or at one Retailer. When several of a
// Product's Size labels cover the size, the narrowest one is shown. With no
// size (she has not picked one yet), Products in stock in at least one plus
// size, with no size_label or fits. Every result lists its in_stock_sizes.
// With priceNear, the closest prices come first (used for "similar").
// Otherwise they come in the saved product order (lib/product-order.js):
// studio catalogue Retailers first, and Retailers take turns, so one
// Retailer's Products are not all together.
exports.searchProducts = async ({
  ukSize = null,
  braBand = null,
  braCup = null,
  category,
  retailerId = null,
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
  if (retailerId !== null) conditions.push(`o.retailer_id = ${param(retailerId, "int")}`);
  if (excludeProductId !== null) conditions.push(`p.product_id <> ${param(excludeProductId, "int")}`);
  // Walking the saved order and stopping at the limit reads only the first
  // Products in it; sorting by price has to look at every match.
  const walk = "o.photo_rank, o.turn, o.shop_order, o.product_id";
  const order = priceNear === null ? walk : `distance, ${walk}`;

  const { rows } = await db.query(
    `WITH picked AS (
       SELECT p.product_id, ${distance} AS distance, o.photo_rank, o.turn, o.shop_order
       FROM product_order o
       JOIN products p USING (product_id)
       JOIN retailers r ON r.retailer_id = p.retailer_id
       WHERE ${conditions.join(" AND ")}
         AND EXISTS (SELECT 1 FROM product_sizes s WHERE s.product_id = p.product_id AND ${matches})
       ORDER BY ${order}
       LIMIT ${param(limit, "int")}
     )
     SELECT found.*, ${IN_STOCK_SIZES} AS in_stock_sizes FROM (
       SELECT p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
         p.price_in_pence, r.last_collected_at AS last_checked_at, p.retailer_id, r.retailer_name,
         s.size_label, s.uk_sizes, s.bra_band, s.bra_cup,
         picked.distance, picked.photo_rank, picked.turn, picked.shop_order
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
     ORDER BY found.distance, found.photo_rank, found.turn, found.shop_order, found.product_id`,
    params
  );
  return rows.map(({ uk_sizes, bra_band, bra_cup, size_label, distance, photo_rank, turn, shop_order, ...row }) => ({
    ...row,
    size_label: browsing ? null : size_label,
    fits: browsing ? null : fitsRange(uk_sizes),
  }));
};

// The Products on a Saved page, in the order asked, whether or not they are
// in stock (spec 0004). A Product gone from its Retailer's data has nothing
// in stock until it is deleted; one a Shopper could no longer find (Retailer
// removed, or taken out of Amara's Pick) is left out, like a deleted one.
// in_stock_uk_sizes lets the page tell whether her size is in stock.
exports.fetchProductsByIds = async (productIds) => {
  const { rows } = await db.query(
    `SELECT p.product_id, p.title, p.colour, p.brand, p.category, p.image_url, p.product_url,
       p.price_in_pence, r.last_collected_at AS last_checked_at, p.retailer_id, r.retailer_name,
       ARRAY(
         SELECT i.size_label FROM product_sizes i
         WHERE i.product_id = p.product_id AND p.missing_since IS NULL AND ${PLUS_IN_STOCK("i")}
         ORDER BY cardinality(i.uk_sizes) = 0, i.uk_sizes, i.bra_band,
                  array_position($2::text[], i.bra_cup), i.size_label) AS in_stock_sizes,
       ARRAY(
         SELECT DISTINCT n FROM product_sizes i, unnest(i.uk_sizes) n
         WHERE i.product_id = p.product_id AND p.missing_since IS NULL
           AND ${PLUS_IN_STOCK("i")} AND n >= ${SMALLEST_PLUS_UK_SIZE}
         ORDER BY n) AS in_stock_uk_sizes
     FROM unnest($1::int[]) WITH ORDINALITY AS asked(product_id, position)
     JOIN products p USING (product_id)
     JOIN retailers r USING (retailer_id)
     WHERE r.removed_at IS NULL AND p.sort_status = 'shown'
     ORDER BY asked.position`,
    [productIds, CUPS]
  );
  return rows;
};
