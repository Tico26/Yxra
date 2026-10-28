// Saves what a Retailer's reader found, and keeps each Product's sizes and
// status in step with the rules, Brand size charts and settled answers.
const crypto = require("crypto");
const db = require("../db/connection");
const { withTransaction } = require("../db/transaction");
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
const retranslateAndSortProduct = async (client, productId, known) => {
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
      `UPDATE product_sizes SET uk_sizes = $2, size_status = $3, bra_band = $4, bra_cup = $5
       WHERE product_size_id = $1`,
      [size.product_size_id, t.uk_sizes, t.size_status, t.bra_band ?? null, t.bra_cup ?? null]
    );
  }
  const { sort_status, sort_reason } = decideStatus(product, translated);
  await client.query(
    `UPDATE products SET sort_status = $2, sort_reason = $3 WHERE product_id = $1`,
    [productId, sort_status, sort_reason]
  );
};

const retranslateAndSortProducts = async (productIds) => {
  for (const id of productIds) await retranslateAndSortProduct(db, id);
};

// A Stock check reaches the database from far away, so a Retailer's products
// are saved a few hundred at a time in a handful of queries, never one
// product at a time.
const PRODUCTS_PER_QUERY = 500;
const SIZES_PER_QUERY = 2000;

const chunks = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

const PRODUCT_FIELDS = `title text, description text, brand text, colour text, product_url text,
  image_url text, price_in_pence int, product_type text, tags text[], text_hash text,
  audience text, category text, excluded_as text, sort_status text, sort_reason text`;

// Works out everything about each found Product in memory: its rules, its
// translated sizes and its status (R7, R8, R10, R11).
const prepareProducts = (retailer, products, existing, known) => {
  const latest = new Map(products.map((found) => [found.external_id, found]));
  return [...latest.values()].map((found) => {
    const hash = textHash(found);
    const before = existing.get(found.external_id);
    // New, or its text changed: the rules read it afresh. Otherwise only stock,
    // price, photo or link can have changed: keep what the rules, the AI or
    // Tico decided.
    const resort = !before || before.text_hash !== hash;
    const sorted = resort ? sortByRules(found, { womenOnly: retailer.women_only }) : before;
    const sizes = [...new Map(found.sizes.map((s) => [s.size_label, s])).values()].map((s) => ({
      size_label: s.size_label,
      in_stock: s.in_stock,
      variant_refs: s.variant_refs || [],
      ...translate(known, found.brand, s.size_label),
    }));
    const { sort_status, sort_reason } = decideStatus(sorted, sizes);
    return {
      product_id: before ? before.product_id : null,
      resort,
      external_id: found.external_id,
      title: found.title,
      description: found.description,
      brand: found.brand,
      colour: found.colour,
      product_url: found.product_url,
      image_url: found.image_url,
      price_in_pence: found.price_in_pence,
      product_type: found.product_type,
      tags: found.tags || [],
      text_hash: hash,
      audience: sorted.audience,
      category: sorted.category,
      excluded_as: sorted.excluded_as,
      sort_status,
      sort_reason,
      sizes,
    };
  });
};

// A row is written only when something about it changed: rewriting every
// row every night doubled the tables on disk (ADR 0008). When it was checked
// is the Retailer's last_collected_at; last_checked_at on a row is when the
// row was last written.
const updateProducts = (client, rows, now) =>
  client.query(
    `UPDATE products p SET title = f.title, description = f.description, brand = f.brand,
       colour = f.colour, product_url = f.product_url, image_url = f.image_url,
       price_in_pence = f.price_in_pence, product_type = f.product_type, tags = f.tags,
       text_hash = f.text_hash, last_checked_at = $2, missing_since = NULL,
       audience = CASE WHEN f.resort THEN f.audience ELSE p.audience END,
       category = CASE WHEN f.resort THEN f.category ELSE p.category END,
       excluded_as = CASE WHEN f.resort THEN f.excluded_as ELSE p.excluded_as END,
       sort_status = f.sort_status, sort_reason = f.sort_reason
     FROM jsonb_to_recordset($1::jsonb) AS f(product_id int, resort boolean, ${PRODUCT_FIELDS})
     WHERE p.product_id = f.product_id
       AND (p.title, p.description, p.brand, p.colour, p.product_url, p.image_url,
            p.price_in_pence, p.product_type, p.tags, p.text_hash, p.missing_since IS NULL,
            p.audience, p.category, p.excluded_as, p.sort_status, p.sort_reason)
         IS DISTINCT FROM
           (f.title, f.description, f.brand, f.colour, f.product_url, f.image_url,
            f.price_in_pence, f.product_type, f.tags, f.text_hash, TRUE,
            CASE WHEN f.resort THEN f.audience ELSE p.audience END,
            CASE WHEN f.resort THEN f.category ELSE p.category END,
            CASE WHEN f.resort THEN f.excluded_as ELSE p.excluded_as END,
            f.sort_status, f.sort_reason)`,
    [JSON.stringify(rows), now]
  );

const insertProducts = async (client, retailer, rows, now) => {
  const { rows: inserted } = await client.query(
    `INSERT INTO products (retailer_id, external_id, title, description, brand, colour,
       product_url, image_url, price_in_pence, product_type, tags, text_hash,
       last_checked_at, first_seen_at, audience, category, excluded_as, sort_status, sort_reason)
     SELECT $2, f.external_id, f.title, f.description, f.brand, f.colour, f.product_url,
       f.image_url, f.price_in_pence, f.product_type, f.tags, f.text_hash, $3, $3,
       f.audience, f.category, f.excluded_as, f.sort_status, f.sort_reason
     FROM jsonb_to_recordset($1::jsonb) AS f(external_id text, ${PRODUCT_FIELDS})
     RETURNING product_id, external_id`,
    [JSON.stringify(rows), retailer.retailer_id, now]
  );
  return new Map(inserted.map((r) => [r.external_id, r.product_id]));
};

const saveSizes = async (client, rows, now) => {
  for (const batch of chunks(rows, PRODUCTS_PER_QUERY)) {
    await client.query(
      `DELETE FROM product_sizes s USING jsonb_to_recordset($1::jsonb) AS f(product_id int, labels text[])
       WHERE s.product_id = f.product_id AND NOT (s.size_label = ANY (f.labels))`,
      [JSON.stringify(batch.map((p) => ({ product_id: p.product_id, labels: p.sizes.map((s) => s.size_label) })))]
    );
  }
  const sizes = rows.flatMap((p) =>
    p.sizes.map((s) => ({
      product_id: p.product_id,
      size_label: s.size_label,
      in_stock: s.in_stock,
      variant_refs: s.variant_refs,
      uk_sizes: s.uk_sizes,
      size_status: s.size_status,
      bra_band: s.bra_band ?? null,
      bra_cup: s.bra_cup ?? null,
    }))
  );
  for (const batch of chunks(sizes, SIZES_PER_QUERY)) {
    await client.query(
      `INSERT INTO product_sizes (product_id, size_label, in_stock, variant_refs, last_checked_at,
         uk_sizes, size_status, bra_band, bra_cup)
       SELECT f.product_id, f.size_label, f.in_stock, f.variant_refs, $2, f.uk_sizes,
         f.size_status, f.bra_band, f.bra_cup
       FROM jsonb_to_recordset($1::jsonb) AS f(product_id int, size_label text, in_stock boolean,
         variant_refs text[], uk_sizes int[], size_status text, bra_band int, bra_cup text)
       ON CONFLICT (product_id, size_label) DO UPDATE
       SET in_stock = EXCLUDED.in_stock, variant_refs = EXCLUDED.variant_refs,
           last_checked_at = EXCLUDED.last_checked_at, uk_sizes = EXCLUDED.uk_sizes,
           size_status = EXCLUDED.size_status, bra_band = EXCLUDED.bra_band,
           bra_cup = EXCLUDED.bra_cup
       WHERE (product_sizes.in_stock, product_sizes.variant_refs, product_sizes.uk_sizes,
              product_sizes.size_status, product_sizes.bra_band, product_sizes.bra_cup)
         IS DISTINCT FROM (EXCLUDED.in_stock, EXCLUDED.variant_refs, EXCLUDED.uk_sizes,
              EXCLUDED.size_status, EXCLUDED.bra_band, EXCLUDED.bra_cup)`,
      [JSON.stringify(batch), now]
    );
  }
};

// Saves one Retailer's full product data from tonight's Stock check. Products
// it no longer lists are hidden from that moment (missing_since) and deleted
// once missing for 30 days.
const saveRetailerProducts = (retailer, products, now = new Date()) =>
  withTransaction(async (client) => {
    const known = await knownTranslations(client, products.map((p) => p.brand));
    const { rows: before } = await client.query(
      `SELECT product_id, external_id, text_hash, audience, category, excluded_as
       FROM products WHERE retailer_id = $1`,
      [retailer.retailer_id]
    );
    const rows = prepareProducts(retailer, products, new Map(before.map((p) => [p.external_id, p])), known);

    const existing = rows.filter((p) => p.product_id);
    for (const batch of chunks(existing, PRODUCTS_PER_QUERY)) await updateProducts(client, batch, now);
    for (const batch of chunks(rows.filter((p) => !p.product_id), PRODUCTS_PER_QUERY)) {
      const ids = await insertProducts(client, retailer, batch, now);
      for (const p of batch) p.product_id = ids.get(p.external_id);
    }
    await saveSizes(client, rows, now);

    await client.query(
      `UPDATE products SET missing_since = $3
       WHERE retailer_id = $1 AND missing_since IS NULL AND NOT (external_id = ANY ($2))`,
      [retailer.retailer_id, products.map((p) => p.external_id), now]
    );
    // Counted in hours, not calendar days: across a clock change a UK day is
    // 23 or 25 hours long, which made the window an hour short.
    const { rowCount: deleted } = await client.query(
      `DELETE FROM products
       WHERE retailer_id = $1 AND missing_since <= $2::timestamptz - make_interval(hours => $3 * 24)`,
      [retailer.retailer_id, now, MISSING_DAYS_BEFORE_DELETE]
    );
    await client.query(
      `UPDATE retailers SET last_collected_at = $2, last_error = NULL WHERE retailer_id = $1`,
      [retailer.retailer_id, now]
    );
    return { saved: products.length, deleted };
  });

// Lingerie used to be excluded (ADR 0007). Products already marked so are
// sorted again by today's rules, since the rules only re-read a Product when
// its text changes. Safe to run on every migrate: afterwards none are left.
const reopenExcludedLingerie = async () => {
  const { rows } = await db.query(
    `SELECT p.product_id, p.title, p.product_type, p.tags, r.women_only
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.excluded_as = 'lingerie'`
  );
  for (const p of rows) {
    const sorted = sortByRules(p, { womenOnly: p.women_only });
    await db.query(
      `UPDATE products SET audience = COALESCE($2, audience), category = $3, excluded_as = $4
       WHERE product_id = $1`,
      [p.product_id, sorted.audience, sorted.category, sorted.excluded_as]
    );
  }
  await retranslateAndSortProducts(rows.map((p) => p.product_id));
  return rows.length;
};

// The rules only re-read a Product when its text changes, so menswear the
// older rules missed (a "Gender_Mens" tag, a title "for Men") is found here
// and taken off the site. Safe to run on every migrate: afterwards none are left.
const excludeMenswear = async () => {
  const { rows } = await db.query(
    `SELECT p.product_id, p.title, p.product_type, p.tags, r.women_only
     FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.audience IS DISTINCT FROM 'men' AND p.audience IS DISTINCT FROM 'other'`
  );
  const found = rows
    .map((p) => ({ product_id: p.product_id, audience: sortByRules(p, { womenOnly: p.women_only }).audience }))
    .filter((p) => p.audience === "men" || p.audience === "other");
  for (const batch of chunks(found, PRODUCTS_PER_QUERY)) {
    await db.query(
      `UPDATE products p SET audience = f.audience, sort_status = 'excluded',
         sort_reason = COALESCE(p.excluded_as, 'not for women (' || f.audience || ')')
       FROM jsonb_to_recordset($1::jsonb) AS f(product_id int, audience text)
       WHERE p.product_id = f.product_id`,
      [JSON.stringify(batch)]
    );
  }
  return found.length;
};

module.exports = {
  saveRetailerProducts,
  excludeMenswear,
  retranslateAndSortProducts,
  reopenExcludedLingerie,
  textHash,
  MISSING_DAYS_BEFORE_DELETE,
};
