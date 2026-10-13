const db = require("../db/connection");

exports.fetchRetailers = async () => {
  const { rows } = await db.query(
    `SELECT * FROM retailers WHERE removed_at IS NULL ORDER BY retailer_name`
  );
  return rows;
};
