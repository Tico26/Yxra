// Prints the Retailers a Stock check run collects as JSON, one
// {"id","name"} per Retailer, for the nightly workflow's matrix.
//   node scripts/list-retailers.js                      (every current Retailer)
//   node scripts/list-retailers.js "7,Thunder Egg"      (only these, by id or name)
const db = require("../db/connection");
const { pickRetailers, parseRetailerList } = require("../lib/stock-check");

const main = async () => {
  const retailers = await pickRetailers(parseRetailerList(process.argv.slice(2).join(",")));
  if (!retailers.length) throw new Error("No current Retailers to collect");
  console.log(JSON.stringify(retailers.map((r) => ({ id: r.retailer_id, name: r.retailer_name }))));
};

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
