const db = require("../db/connection");
exports.fetchShops = () => {
  return db.query(`SELECT * FROM shops`).then(({ rows }) => rows);
};
