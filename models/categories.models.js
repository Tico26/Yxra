const db = require("../db/connection");

exports.fetchCategories = async () => {
  const { rows } = await db.query(`SELECT * FROM categories ORDER BY category_id`);
  return rows;
};

exports.fetchCategoryById = async (categoryId) => {
  const { rows } = await db.query(`SELECT * FROM categories WHERE category_id = $1`, [
    categoryId,
  ]);
  return rows[0];
};
