// A Click-out: a Live check of the Product in her UK size (R18), then either
// the Retailer's link or, if it just sold out, similar Products (R19, R20).
const db = require("../db/connection");
const { notFound } = require("../lib/errors");
const { SHOPPABLE, searchProducts } = require("./products.models");
const { liveChecks } = require("../lib/collect");

const SIMILAR_LIMIT = 4;

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Live check timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const record = (productId, ukSize, outcome) =>
  db.query(`INSERT INTO click_outs (product_id, uk_size, outcome) VALUES ($1, $2, $3)`, [
    productId,
    ukSize,
    outcome,
  ]);

exports.clickOut = async ({ productId, ukSize, fetcher, timeoutMs }) => {
  const {
    rows: [product],
  } = await db.query(
    `SELECT p.*, r.source FROM products p JOIN retailers r USING (retailer_id)
     WHERE p.product_id = $1 AND ${SHOPPABLE}`,
    [productId]
  );
  if (!product) throw notFound("Product");
  const { rows: sizes } = await db.query(
    `SELECT size_label, uk_sizes, variant_refs FROM product_sizes
     WHERE product_id = $1 AND size_status = 'translated' AND $2 = ANY (uk_sizes)`,
    [productId, ukSize]
  );

  let live;
  try {
    const check = liveChecks[product.source];
    if (!check || !fetcher || !sizes.length) throw new Error("Live check not possible");
    live = await withTimeout(check(product, sizes, fetcher), timeoutMs);
  } catch {
    await record(productId, ukSize, "check_failed");
    return { outcome: "sent", url: product.product_url };
  }

  for (const [label, inStock] of live) {
    await db.query(
      `UPDATE product_sizes SET in_stock = $3, last_checked_at = NOW()
       WHERE product_id = $1 AND size_label = $2`,
      [productId, label, inStock]
    );
  }
  const stillInStock = sizes.some((s) => live.get(s.size_label) !== false);
  if (stillInStock) {
    await record(productId, ukSize, "sent");
    return { outcome: "sent", url: product.product_url };
  }

  await record(productId, ukSize, "sold_out");
  const similar = await searchProducts({
    ukSize,
    category: product.category,
    excludeProductId: productId,
    priceNear: product.price_in_pence,
    limit: SIMILAR_LIMIT,
  });
  return { outcome: "sold_out", message: `Just sold out in ${ukSize}`, similar };
};
