const db = require("../db/connection");

exports.fetchProducts = () => {
  return db.query(`SELECT * FROM products;`).then(({ rows }) => {
    return rows;
  });
};
exports.fetchProductById = (productId) => {
  return db
    .query(`SELECT * FROM products WHERE product_id = $1;`, [productId])
    .then(({ rows }) => {
      return rows[0];
    });
};
exports.postProduct = (
  product_url,
  image,
  product_name,
  price_in_pence,
  product_description,
  size,
  colour,
  product_category,
  shop_id
) => {
  return db
    .query(
      `INSERT INTO products
    (product_url,image,product_name,
    price_in_pence,product_description,
    size,colour,product_category,shop_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        product_url,
        image,
        product_name,
        price_in_pence,
        product_description,
        size,
        colour,
        product_category,
        shop_id,
      ]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};
exports.patchProduct = (
  productId,
  product_url,
  image,
  product_name,
  price_in_pence,
  product_description,
  size,
  colour,
  product_category,
  shop_id
) => {
  return db
    .query(
      `UPDATE products
        SET product_url = $1,image=$2,product_name=$3,
        price_in_pence=$4,product_description=$5,
        size=$6,colour=$7,product_category=$8, shop_id=$9
        WHERE product_id = $10 RETURNING *`,
      [
        product_url,
        image,
        product_name,
        price_in_pence,
        product_description,
        size,
        colour,
        product_category,
        shop_id,
        productId,
      ]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};
exports.deleteProduct = (product_id) => {
  return db.query(`DELETE FROM products WHERE product_id=$1`, [product_id]);
};
