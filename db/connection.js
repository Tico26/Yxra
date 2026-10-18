const { Pool } = require("pg");
const ENV = process.env.NODE_ENV || "development";
const config = {};

require("dotenv").config({
  path: `${__dirname}/../.env.${ENV}`,
});

if (!process.env.PGDATABASE && !process.env.DATABASE_URL) {
  throw new Error("PGDATABASE not set or DATABASE_URL not set");
}

if (ENV === "production") {
  config.connectionString = process.env.DATABASE_URL;
  config.max = 2;
  // Supabase requires TLS; its certificate is signed by Supabase's own CA,
  // which Node does not ship, so the connection is encrypted but not pinned.
  config.ssl = { rejectUnauthorized: false };
}
module.exports = new Pool(config);
