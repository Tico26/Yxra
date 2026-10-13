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
