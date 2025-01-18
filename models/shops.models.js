const db = require("../db/connection");

exports.fetchShops = () => {
  return db.query(`SELECT * FROM shops`).then(({ rows }) => rows);
};

exports.fetchShopById = (shop_id) => {
  return db
    .query(
      `
        SELECT * FROM shops 
        WHERE shop_id=$1`,
      [shop_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};
