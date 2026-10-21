// Applies db/schema.sql to the database without dropping anything, then adds
// the launch categories, which every Product's category must be one of.
const fs = require("fs");
const path = require("path");
const format = require("pg-format");
const db = require("./connection");
const categories = require("./data/categories");

const migrate = async () => {
  await db.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  await db.query(
    format(
      `INSERT INTO categories (category_name, category_description) VALUES %L
       ON CONFLICT (category_name) DO NOTHING`,
      categories.map((c) => [c.category_name, c.category_description])
    )
  );
};

migrate()
  .then(() => console.log("Schema is up to date"))
  .finally(() => db.end());
