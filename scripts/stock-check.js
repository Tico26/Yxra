// Runs the nightly Stock check against the database in DATABASE_URL (or the
// local one). Exits non-zero only if every Retailer failed.
const db = require("../db/connection");
const { runStockCheck } = require("../lib/stock-check");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const main = async () => {
  const summary = await runStockCheck({ fetcher: createPoliteFetcher() });
  console.log(
    `Stock check done: ${summary.collected.length} Retailers collected, ${summary.failed.length} failed`
  );
  if (summary.failed.length && !summary.collected.length) process.exitCode = 1;
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
