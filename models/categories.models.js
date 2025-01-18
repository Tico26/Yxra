const db = require("../db/connection");

exports.fetchCategories = () => {
  return db.query(`SELECT * FROM categories;`).then(({ rows }) => {
    return rows;
  });
};

exports.fetchCategoryById = (categoryId) => {
  return db
    .query(
      `SELECT * FROM categories 
        WHERE category_id = $1`,
      [categoryId]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.postCategory = (categoryName, categoryDescription) => {
  return db
    .query(
      `
        INSERT INTO categories (category_name,category_description)
        VALUES($1,$2) RETURNING *
        `,
      [categoryName, categoryDescription]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.patchCategory = (categoryId, categoryName, categoryDescription) => {
  return db
    .query(
      `
        UPDATE categories 
        SET category_name = $1,
        category_description = $2
        WHERE category_id = $3 
        RETURNING *
        `,
      [categoryName, categoryDescription, categoryId]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.deleteCategory = (categoryId) => {
  return db.query(
    `
    DELETE FROM categories where category_id=$1`,
    [categoryId]
  );
};
