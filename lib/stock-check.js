// The nightly Stock check: collects every current Retailer from its own
// source. One Retailer failing never stops the others (R6).
const db = require("../db/connection");
const { collectRetailer } = require("./collect");
const { fetchActiveRetailers } = require("../models/retailers.models");

const runStockCheck = async ({ fetcher, now = new Date(), log = console.log } = {}) => {
  const summary = { collected: [], failed: [] };
  for (const retailer of await fetchActiveRetailers()) {
    try {
      const { saved, deleted } = await collectRetailer(retailer, { fetcher, now });
      summary.collected.push({ retailer: retailer.retailer_name, saved, deleted });
      log(`${retailer.retailer_name}: ${saved} Products, ${deleted} deleted`);
    } catch (err) {
      summary.failed.push({ retailer: retailer.retailer_name, error: err.message });
      log(`${retailer.retailer_name}: FAILED, keeping last known stock (${err.message})`);
      await db.query(`UPDATE retailers SET last_error = $2 WHERE retailer_id = $1`, [
        retailer.retailer_id,
        err.message.slice(0, 1000),
      ]);
    }
  }
  return summary;
};

module.exports = { runStockCheck };
