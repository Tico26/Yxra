const { AsyncLocalStorage } = require("async_hooks");
const { Pool } = require("pg");
const ENV = process.env.NODE_ENV || "development";

// Workers have no .env files (nor __dirname); their settings are bindings.
if (typeof __dirname !== "undefined") {
  require("dotenv").config({ path: `${__dirname}/../.env.${ENV}` });
}

// On Cloudflare Workers a database connection can't outlive the request that
// opened it, so the Worker (api-worker.mjs) runs each request inside
// requestPool.run(pool, ...) and every query in that request uses that pool.
// Everywhere else (tests, scripts, `npm start`) one shared pool is made on
// first use.
const requestPool = new AsyncLocalStorage();
let shared;

const makeSharedPool = () => {
  if (!process.env.PGDATABASE && !process.env.DATABASE_URL) {
    throw new Error("PGDATABASE not set or DATABASE_URL not set");
  }
  const config = {};
  if (ENV === "production") {
    config.connectionString = process.env.DATABASE_URL;
    config.max = 2;
    // Supabase requires TLS; its certificate is signed by Supabase's own CA,
    // which Node does not ship, so the connection is encrypted but not pinned.
    config.ssl = { rejectUnauthorized: false };
  }
  return new Pool(config);
};

const current = () => requestPool.getStore() || (shared ||= makeSharedPool());

module.exports = {
  query: (...args) => current().query(...args),
  connect: () => current().connect(),
  end: () => current().end(),
  requestPool,
};
