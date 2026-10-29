// Applies db/schema.sql (and on Supabase, db/shoppers.sql) to the database
// without dropping anything, then adds the launch categories, which every
// Product's category must be one of, and re-sorts Products excluded as
// lingerie before lingerie was shown, takes off menswear older rules missed,
// and gives Clothes Products without a Clothes type theirs from the rules.
//
// A Stock check saves each Retailer in one long transaction. A schema change
// that has to wait for it would also hold up every live-site read queued
// behind it, so each attempt gives up after a few seconds and tries again.
const fs = require("fs");
const path = require("path");
const format = require("pg-format");
const db = require("./connection");
const categories = require("./data/categories");
const { reopenExcludedLingerie, excludeMenswear, fillClothesTypes } = require("../lib/catalogue");
const { rebuildProductOrder } = require("../lib/product-order");

const LOCK_NOT_AVAILABLE = "55P03";

const applySchema = async (lockTimeoutMs) => {
  const client = await db.connect();
  try {
    await client.query(`SET lock_timeout = ${Number(lockTimeoutMs)}`);
    await client.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
    // Shopper accounts need Supabase Auth, so they are left out elsewhere.
    const { rows } = await client.query(`SELECT to_regnamespace('auth') IS NOT NULL AS supabase`);
    if (rows[0].supabase) {
      await client.query(fs.readFileSync(path.join(__dirname, "shoppers.sql"), "utf8"));
    }
  } finally {
    client.release();
  }
};

const migrate = async ({
  lockTimeoutMs = 5000,
  retryEveryMs = 30000,
  giveUpAfterMs = 10 * 60 * 1000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) => {
  const started = Date.now();
  for (;;) {
    try {
      await applySchema(lockTimeoutMs);
      break;
    } catch (err) {
      if (err.code !== LOCK_NOT_AVAILABLE || Date.now() - started >= giveUpAfterMs) {
        if (err.code === LOCK_NOT_AVAILABLE) {
          err.message = `A schema change kept waiting on a table in use, most likely by a Stock check: ${err.message}`;
        }
        throw err;
      }
      console.log("A table is in use, most likely by a Stock check; trying again shortly");
      await sleep(retryEveryMs);
    }
  }
  await db.query(
    format(
      `INSERT INTO categories (category_name, category_description) VALUES %L
       ON CONFLICT (category_name) DO NOTHING`,
      categories.map((c) => [c.category_name, c.category_description])
    )
  );
  const reopened = await reopenExcludedLingerie();
  if (reopened) console.log(`Sorted ${reopened} Products that were excluded as lingerie again`);
  const menswear = await excludeMenswear();
  if (menswear) console.log(`Took ${menswear} Products for men or children off the site`);
  const typed = await fillClothesTypes();
  if (typed) console.log(`Gave ${typed} Clothes Products their Clothes type`);
  // The product list reads this order; a deploy mixes it afresh.
  await rebuildProductOrder();
};

if (require.main === module) {
  migrate()
    .then(() => console.log("Schema is up to date"))
    .finally(() => db.end());
}

module.exports = { migrate };
