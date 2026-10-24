// The nightly Stock check: collects every current Retailer from its own
// source. One Retailer failing never stops the others (R6).
const db = require("../db/connection");
const { collectRetailer } = require("./collect");
const { fetchRetailers } = require("../models/retailers.models");

// The current Retailers a run collects. `wanted` lists retailer ids or names
// (any case); empty means every current Retailer. One that matches no current
// Retailer is an error, so a typo never quietly collects nothing.
const pickRetailers = async (wanted = []) => {
  const retailers = await fetchRetailers();
  if (!wanted.length) return retailers;
  const picked = [];
  for (const raw of wanted) {
    const key = String(raw).trim();
    const found = retailers.find((r) =>
      /^\d+$/.test(key)
        ? r.retailer_id === Number(key)
        : r.retailer_name.toLowerCase() === key.toLowerCase()
    );
    if (!found) throw new Error(`${key} is not a current Retailer`);
    if (!picked.includes(found)) picked.push(found);
  }
  return picked;
};

// Splits "3, Rock Those Curves,7" into ["3", "Rock Those Curves", "7"].
const parseRetailerList = (text = "") =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const runStockCheck = async ({ fetcher, now = new Date(), log = console.log, only = [] } = {}) => {
  const summary = { collected: [], failed: [] };
  for (const retailer of await pickRetailers(only)) {
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

module.exports = { runStockCheck, pickRetailers, parseRetailerList };
