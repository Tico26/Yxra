// A Click-out: sends her to the Retailer's page for the Product, as it stood
// at the nightly Stock check (ADR 0006: no Live check at Click-out), and
// records it (R21).
const db = require("../db/connection");
const { notFound } = require("../lib/errors");
const { SHOPPABLE } = require("./products.models");

// Shopify links name a variant; point it at her size so she lands with it
// already chosen rather than on the first (often smallest, maybe sold-out) size.
const linkForHerSize = (product, sizes) => {
  if (product.source !== "shopify") return product.product_url;
  const size =
    sizes.find((s) => s.in_stock && s.variant_refs.length) ||
    sizes.find((s) => s.variant_refs.length);
  if (!size) return product.product_url;
  const url = new URL(product.product_url);
  url.searchParams.set("variant", size.variant_refs[0]);
  return url.toString();
};

exports.clickOut = async ({ productId, ukSize }) => {
  const {
    rows: [product],
  } = await db.query(
    `SELECT p.*, r.source FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.product_id = $1 AND ${SHOPPABLE}`,
    [productId]
  );
  if (!product) throw notFound("Product");
  const { rows: sizes } = await db.query(
    `SELECT size_label, in_stock, variant_refs FROM product_sizes
     WHERE product_id = $1 AND size_status = 'translated' AND $2 = ANY (uk_sizes)
     ORDER BY cardinality(uk_sizes)`,
    [productId, ukSize]
  );
  await db.query(`INSERT INTO click_outs (product_id, uk_size, outcome) VALUES ($1, $2, 'sent')`, [
    productId,
    ukSize,
  ]);
  return { outcome: "sent", url: linkForHerSize(product, sizes) };
};
