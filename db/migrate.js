// Applies db/schema.sql to the database without dropping anything.
const fs = require("fs");
const path = require("path");
const db = require("./connection");

db.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"))
  .then(() => console.log("Schema is up to date"))
  .finally(() => db.end());
