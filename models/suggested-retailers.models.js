const { HttpError, notFound } = require("../lib/errors");
const { withTransaction } = require("../db/transaction");
const { addRetailer } = require("./retailers.models");

const pending = async (client, id) => {
  const {
    rows: [suggested],
  } = await client.query(
    `SELECT * FROM suggested_retailers WHERE suggested_retailer_id = $1 FOR UPDATE`,
    [id]
  );
  if (!suggested) throw notFound("Suggested Retailer");
  if (suggested.status !== "pending") {
    throw new HttpError(409, `Already ${suggested.status}`);
  }
  return suggested;
};

const decide = (client, id, status) =>
  client.query(
    `UPDATE suggested_retailers SET status = $2, decided_at = NOW()
     WHERE suggested_retailer_id = $1`,
    [id, status]
  );

// Approving makes it a Retailer, collected from the next Stock check.
exports.approveSuggestedRetailer = (id, { women_only = false } = {}) =>
  withTransaction(async (client) => {
    const suggested = await pending(client, id);
    const retailer = await addRetailer(
      {
        retailer_name: suggested.retailer_name,
        site_url: suggested.site_url,
        source: suggested.source,
        women_only,
      },
      client
    );
    await decide(client, id, "approved");
    return retailer;
  });

// A rejected Suggested Retailer stays on record so discovery never suggests
// it again (R23).
exports.rejectSuggestedRetailer = (id) =>
  withTransaction(async (client) => {
    await pending(client, id);
    await decide(client, id, "rejected");
  });
