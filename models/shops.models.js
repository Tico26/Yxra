const db = require("../db/connection");

exports.fetchShops = () => {
  return db.query(`SELECT * FROM shops`).then(({ rows }) => rows);
};

exports.fetchShopById = (shopId) => {
  return db
    .query(
      `
        SELECT * FROM shops 
        WHERE shop_id=$1`,
      [shopId]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.postShop = (shopName, shopUrl, location, categoryId) => {
  return db
    .query(
      `
        INSERT INTO shops (shop_name,shop_url,location,category_id) 
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
      [shopName, shopUrl, location, categoryId]
    )
    .then(({ rows }) => {
      return rows;
    });
};
