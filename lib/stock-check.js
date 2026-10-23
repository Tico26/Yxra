// The nightly Stock check: collects every current Retailer from its own
// source. One Retailer failing never stops the others (R6). Retailers are
// collected side by side, a few at a time: the polite wait is per site, so
// this asks no site any faster, and one big site no longer holds up the rest.
const db = require("../db/connection");
const { collectRetailer } = require("./collect");
const { fetchRetailers } = require("../models/retailers.models");

const AT_ONCE = 6;

const runStockCheck = async ({ fetcher, now = new Date(), log = console.log, atOnce = AT_ONCE } = {}) => {
  const retailers = await fetchRetailers();
  const results = new Array(retailers.length);

  const checkOne = async (retailer) => {
    try {
      const { saved, deleted } = await collectRetailer(retailer, { fetcher, now });
      log(`${retailer.retailer_name}: ${saved} Products, ${deleted} deleted`);
      return { collected: { retailer: retailer.retailer_name, saved, deleted } };
    } catch (err) {
      log(`${retailer.retailer_name}: FAILED, keeping last known stock (${err.message})`);
      await db.query(`UPDATE retailers SET last_error = $2 WHERE retailer_id = $1`, [
        retailer.retailer_id,
        err.message.slice(0, 1000),
      ]);
      return { failed: { retailer: retailer.retailer_name, error: err.message } };
    }
  };

  let next = 0;
  const worker = async () => {
    while (next < retailers.length) {
      const i = next++;
      results[i] = await checkOne(retailers[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(atOnce, retailers.length) }, worker));

  // The summary lists Retailers in their usual order, whichever finished first.
  return {
    collected: results.filter((r) => r.collected).map((r) => r.collected),
    failed: results.filter((r) => r.failed).map((r) => r.failed),
  };
};

module.exports = { runStockCheck };
