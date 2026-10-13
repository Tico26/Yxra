// The Review list: what Yxra could not settle by itself, waiting for Tico.
const db = require("../db/connection");
const { badRequest, notFound } = require("../lib/errors");
const { brandKey, sizeLabelKey } = require("../lib/sizes");
const { refreshProducts } = require("../lib/catalogue");
const { LAUNCH_CATEGORIES } = require("../lib/query");

const LIVE = `r.removed_at IS NULL AND p.missing_since IS NULL`;

const parseUkSizes = (value) => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((n) => Number.isInteger(n) && n >= 4 && n <= 40 && n % 2 === 0)
  ) {
    throw badRequest("uk_sizes must be a list of even UK sizes, like [18, 20]");
  }
  return [...new Set(value)].sort((a, b) => a - b);
};

exports.fetchReviewList = async () => {
  const { rows: size_labels } = await db.query(
    `SELECT MIN(p.brand) AS brand, MIN(s.size_label) AS size_label,
            COUNT(DISTINCT p.product_id)::int AS products,
            MIN(p.product_url) AS example_url,
            BOOL_OR(t.source = 'ai') AS ai_unsure
     FROM product_sizes s
     JOIN products p USING (product_id)
     JOIN retailers r USING (retailer_id)
     LEFT JOIN size_translations t
       ON t.brand_key = LOWER(TRIM(COALESCE(p.brand, '')))
      AND t.size_label_key = LOWER(REGEXP_REPLACE(TRIM(s.size_label), '\\s+', ' ', 'g'))
     WHERE ${LIVE} AND s.size_status = 'unsettled' AND p.sort_status <> 'excluded'
     GROUP BY LOWER(TRIM(COALESCE(p.brand, ''))),
              LOWER(REGEXP_REPLACE(TRIM(s.size_label), '\\s+', ' ', 'g'))
     ORDER BY products DESC, brand, size_label`
  );
  const { rows: products } = await db.query(
    `SELECT p.product_id, p.title, p.colour, p.brand, p.product_url, p.image_url,
            p.product_type, p.tags, p.audience, p.category, p.sort_reason,
            p.ai_asked_hash = p.text_hash AS ai_unsure, r.retailer_name
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE ${LIVE} AND p.sort_status = 'unsettled'
       AND (p.audience IS NULL OR p.category IS NULL)
     ORDER BY p.first_seen_at, p.product_id`
  );
  const { rows: suggested_retailers } = await db.query(
    `SELECT * FROM suggested_retailers WHERE status = 'pending' ORDER BY suggested_at`
  );
  return { size_labels, products, suggested_retailers };
};

const productsWithLabel = async (brand, sizeLabel) => {
  const { rows } = await db.query(
    `SELECT DISTINCT p.product_id FROM products p JOIN product_sizes s USING (product_id)
     WHERE LOWER(TRIM(COALESCE(p.brand, ''))) = $1
       AND LOWER(REGEXP_REPLACE(TRIM(s.size_label), '\\s+', ' ', 'g')) = ANY ($2)`,
    [brandKey(brand), [].concat(sizeLabel).map(sizeLabelKey)]
  );
  return rows.map((r) => r.product_id);
};

const saveTranslation = (brand, sizeLabel, ukSizes, source, confidence = null) =>
  db.query(
    `INSERT INTO size_translations (brand_key, size_label_key, uk_sizes, source, confidence)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (brand_key, size_label_key) DO UPDATE
     SET uk_sizes = EXCLUDED.uk_sizes, source = EXCLUDED.source,
         confidence = EXCLUDED.confidence, created_at = NOW()`,
    [brandKey(brand), sizeLabelKey(sizeLabel), ukSizes, source, confidence]
  );
exports.saveTranslation = saveTranslation;

// Tico settles a Size label for a Brand; every Product of that Brand with
// that label is translated at once, and future ones automatically.
exports.settleSizeLabel = async ({ brand, size_label, uk_sizes }) => {
  if (typeof size_label !== "string" || !size_label.trim()) {
    throw badRequest("size_label is required");
  }
  const ukSizes = parseUkSizes(uk_sizes);
  await saveTranslation(brand || "", size_label, ukSizes, "tico");
  await refreshProducts(await productsWithLabel(brand || "", size_label));
  return { brand: brand || "", size_label, uk_sizes: ukSizes };
};

exports.saveSizeChart = async (brand, sizes) => {
  if (!Array.isArray(sizes) || sizes.length === 0) {
    throw badRequest("sizes must be a list of { size_label, uk_sizes }");
  }
  const rows = sizes.map((s) => {
    if (typeof s.size_label !== "string" || !s.size_label.trim()) {
      throw badRequest("each size needs a size_label");
    }
    return { size_label: s.size_label, uk_sizes: parseUkSizes(s.uk_sizes) };
  });
  for (const row of rows) await saveTranslation(brand, row.size_label, row.uk_sizes, "chart");
  await refreshProducts(await productsWithLabel(brand, rows.map((r) => r.size_label)));
  return rows;
};

const AUDIENCES = ["women", "men", "other"];

// Tico sorts a Product the rules could not: who it is for and what it is, or
// that it is something Yxra does not show.
exports.settleProduct = async (productId, { audience, category, excluded_as }) => {
  if (excluded_as !== undefined && (typeof excluded_as !== "string" || !excluded_as.trim())) {
    throw badRequest("excluded_as must name what the Product is, like shoes");
  }
  if (!excluded_as) {
    if (!AUDIENCES.includes(audience)) throw badRequest(`audience must be one of ${AUDIENCES.join(", ")}`);
    if (audience === "women" && !LAUNCH_CATEGORIES.includes(category)) {
      throw badRequest(`category must be one of ${LAUNCH_CATEGORIES.join(", ")}`);
    }
  }
  const { rowCount } = await db.query(
    `UPDATE products SET audience = COALESCE($2, audience), category = $3, excluded_as = $4
     WHERE product_id = $1`,
    [
      productId,
      excluded_as ? null : audience,
      excluded_as ? null : category || null,
      excluded_as ? excluded_as.trim() : null,
    ]
  );
  if (!rowCount) throw notFound("Product");
  await refreshProducts([productId]);
};
