const fs = require("fs");
const path = require("path");
const format = require("pg-format");
const db = require("./connection");
const { brandKey, sizeLabelKey } = require("../lib/sizes");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

const dropAll = () =>
  db.query(`DROP TABLE IF EXISTS click_outs, suggested_retailers, size_translations,
    product_sizes, products, retailers, categories, shops CASCADE`);

const seed = async ({
  categories,
  retailers,
  products,
  sizeTranslations = [],
  suggestedRetailers = [],
}) => {
  await dropAll();
  await db.query(schema);

  await db.query(
    format(
      `INSERT INTO categories (category_name, category_description) VALUES %L`,
      categories.map((c) => [c.category_name, c.category_description])
    )
  );

  const { rows: insertedRetailers } = await db.query(
    format(
      `INSERT INTO retailers (retailer_name, site_url, source, women_only, removed_at,
         last_collected_at)
       VALUES %L RETURNING retailer_id, site_url`,
      retailers.map((r) => [
        r.retailer_name,
        r.site_url,
        r.source,
        r.women_only || false,
        r.removed_at || null,
        r.last_collected_at || null,
      ])
    )
  );
  const retailerIds = Object.fromEntries(
    insertedRetailers.map((r) => [r.site_url, r.retailer_id])
  );

  for (const p of products) {
    const {
      rows: [{ product_id }],
    } = await db.query(
      `INSERT INTO products (retailer_id, external_id, title, description, brand, colour,
         product_url, image_url, price_in_pence, product_type, tags, audience, category,
         sort_status, last_checked_at, missing_since)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING product_id`,
      [
        retailerIds[p.retailer_site],
        p.external_id,
        p.title,
        p.description,
        p.brand,
        p.colour,
        p.product_url,
        p.image_url,
        p.price_in_pence,
        p.product_type,
        p.tags,
        p.audience,
        p.category,
        p.sort_status,
        p.last_checked_at,
        p.missing_since,
      ]
    );
    for (const s of p.sizes) {
      await db.query(
        `INSERT INTO product_sizes (product_id, size_label, uk_sizes, size_status, in_stock,
           variant_refs, last_checked_at, bra_band, bra_cup)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          product_id,
          s.size_label,
          s.uk_sizes || [],
          s.size_status || "translated",
          s.in_stock,
          s.variant_refs || [],
          p.last_checked_at,
          s.bra_band || null,
          s.bra_cup || null,
        ]
      );
    }
  }

  for (const t of sizeTranslations) {
    await db.query(
      `INSERT INTO size_translations (brand_key, size_label_key, uk_sizes, source)
       VALUES ($1,$2,$3,$4)`,
      [brandKey(t.brand), sizeLabelKey(t.size_label), t.uk_sizes, t.source]
    );
  }

  for (const s of suggestedRetailers) {
    await db.query(
      `INSERT INTO suggested_retailers (retailer_name, site_url, source, found_via, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [s.retailer_name, s.site_url, s.source, s.found_via || null, s.status || "pending"]
    );
  }
};

module.exports = seed;
