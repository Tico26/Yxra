// Saves what a Retailer's reader found, and keeps each Product's sizes and
// status in step with the rules, Brand size charts and settled answers.
const crypto = require("crypto");
const db = require("../db/connection");
const { brandKey, sizeLabelKey, translateSizeLabel } = require("./sizes");
const { sortByRules, decideStatus } = require("./sorting");

// Products missing from their Retailer's data this long are deleted (R17).
const MISSING_DAYS_BEFORE_DELETE = 30;

// The AI is re-asked about a Product only when this changes (R8).
const textHash = ({ title, description, sizes }) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify([title, description || "", sizes.map((s) => s.size_label).sort()])
    )
    .digest("hex");

const knownTranslations = async (client, brands) => {
  const { rows } = await client.query(
    `SELECT brand_key, size_label_key, uk_sizes FROM size_translations
     WHERE brand_key = ANY ($1)`,
    [[...new Set(brands.map(brandKey))]]
  );
  return new Map(rows.map((r) => [`${r.brand_key}|${r.size_label_key}`, r]));
};

const translate = (known, brand, label) =>
  translateSizeLabel(label, known.get(`${brandKey(brand)}|${sizeLabelKey(label)}`));

// Re-translates a Product's sizes and works out its status again.
const refreshProduct = async (client, productId, known) => {
  const {
    rows: [product],
  } = await client.query(`SELECT * FROM products WHERE product_id = $1`, [productId]);
  if (!product) return;
  if (!known) known = await knownTranslations(client, [product.brand]);

  const { rows: sizes } = await client.query(
    `SELECT product_size_id, size_label FROM product_sizes WHERE product_id = $1`,
    [productId]
  );
  const translated = [];
  for (const size of sizes) {
    const t = translate(known, product.brand, size.size_label);
    translated.push(t);
    await client.query(
      `UPDATE product_sizes SET uk_sizes = $2, size_status = $3 WHERE product_size_id = $1`,
      [size.product_size_id, t.uk_sizes, t.size_status]
    );
  }
  const { sort_status, sort_reason } = decideStatus(product, translated);
  await client.query(
    `UPDATE products SET sort_status = $2, sort_reason = $3 WHERE product_id = $1`,
    [productId, sort_status, sort_reason]
  );
};

const refreshProducts = async (productIds) => {
  for (const id of productIds) await refreshProduct(db, id);
};

const saveProduct = async (client, retailer, found, now, known) => {
  const hash = textHash(found);
  const {
    rows: [existing],
  } = await client.query(
    `SELECT product_id, text_hash FROM products WHERE retailer_id = $1 AND external_id = $2`,
    [retailer.retailer_id, found.external_id]
  );

  const common = [
    found.title,
    found.description,
    found.brand,
    found.colour,
    found.product_url,
    found.image_url,
    found.price_in_pence,
    found.product_type,
    found.tags || [],
    hash,
    now,
  ];
  let productId;
  if (!existing || existing.text_hash !== hash) {
    // New, or its text changed: the rules read it afresh (R7, R8).
    const sorted = sortByRules(found, { womenOnly: retailer.women_only });
    const fields = [...common, sorted.audience, sorted.category, sorted.excluded_as];
    if (existing) {
      productId = existing.product_id;
      await client.query(
        `UPDATE products SET title=$2, description=$3, brand=$4, colour=$5, product_url=$6,
           image_url=$7, price_in_pence=$8, product_type=$9, tags=$10, text_hash=$11,
           last_checked_at=$12, missing_since=NULL, audience=$13, category=$14, excluded_as=$15
         WHERE product_id = $1`,
        [productId, ...fields]
      );
    } else {
      const { rows } = await client.query(
        `INSERT INTO products (retailer_id, external_id, title, description, brand, colour,
           product_url, image_url, price_in_pence, product_type, tags, text_hash,
           last_checked_at, first_seen_at, audience, category, excluded_as)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$14,$15,$16)
         RETURNING product_id`,
        [retailer.retailer_id, found.external_id, ...fields]
      );
      productId = rows[0].product_id;
    }
  } else {
    // Only stock, price, photo or link can have changed: keep what the rules,
    // the AI or Tico decided.
    productId = existing.product_id;
    await client.query(
      `UPDATE products SET title=$2, description=$3, brand=$4, colour=$5, product_url=$6,
         image_url=$7, price_in_pence=$8, product_type=$9, tags=$10, text_hash=$11,
         last_checked_at=$12, missing_since=NULL
       WHERE product_id = $1`,
      [productId, ...common]
    );
  }

  const labels = found.sizes.map((s) => s.size_label);
  await client.query(
    `DELETE FROM product_sizes WHERE product_id = $1 AND NOT (size_label = ANY ($2))`,
    [productId, labels]
  );
  for (const size of found.sizes) {
    await client.query(
      `INSERT INTO product_sizes (product_id, size_label, in_stock, variant_refs, last_checked_at)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (product_id, size_label) DO UPDATE
       SET in_stock = EXCLUDED.in_stock, variant_refs = EXCLUDED.variant_refs,
           last_checked_at = EXCLUDED.last_checked_at`,
      [productId, size.size_label, size.in_stock, size.variant_refs || [], now]
    );
  }
  await refreshProduct(client, productId, known);
  return productId;
};

// Saves one Retailer's full product data from tonight's Stock check. Products
// it no longer lists are hidden from that moment (missing_since) and deleted
// once missing for 30 days.
const saveRetailerProducts = async (retailer, products, now = new Date()) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const known = await knownTranslations(client, products.map((p) => p.brand));
    for (const found of products) await saveProduct(client, retailer, found, now, known);

    await client.query(
      `UPDATE products SET missing_since = $3
       WHERE retailer_id = $1 AND missing_since IS NULL AND NOT (external_id = ANY ($2))`,
      [retailer.retailer_id, products.map((p) => p.external_id), now]
    );
    const { rowCount: deleted } = await client.query(
      `DELETE FROM products
       WHERE retailer_id = $1 AND missing_since <= $2::timestamptz - make_interval(days => $3)`,
      [retailer.retailer_id, now, MISSING_DAYS_BEFORE_DELETE]
    );
    await client.query(
      `UPDATE retailers SET last_collected_at = $2, last_error = NULL WHERE retailer_id = $1`,
      [retailer.retailer_id, now]
    );
    await client.query("COMMIT");
    return { saved: products.length, deleted };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { saveRetailerProducts, refreshProducts, textHash, MISSING_DAYS_BEFORE_DELETE };
