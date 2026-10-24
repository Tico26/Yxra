// Runs the nightly Stock check against the database in DATABASE_URL (or the
// local one). Exits non-zero only if every Retailer it tried failed.
//   npm run stock-check                        (every current Retailer)
//   npm run stock-check -- 7                   (one, by retailer_id)
//   npm run stock-check -- "7,Thunder Egg"     (several, by id or name)
const db = require("../db/connection");
const { runStockCheck, parseRetailerList } = require("../lib/stock-check");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const main = async () => {
  const only = parseRetailerList(process.argv.slice(2).join(","));
  const summary = await runStockCheck({ fetcher: createPoliteFetcher(), only });
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
