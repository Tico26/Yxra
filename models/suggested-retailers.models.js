const db = require("../db/connection");
const { HttpError, notFound } = require("../lib/errors");
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

// Approving makes it a Retailer, collected from the next Stock check.
exports.approveSuggestedRetailer = async (id, { women_only = false } = {}) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
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
    await client.query(
      `UPDATE suggested_retailers SET status = 'approved', decided_at = NOW()
       WHERE suggested_retailer_id = $1`,
      [id]
    );
    await client.query("COMMIT");
    return retailer;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// A rejected shop stays on record so discovery never suggests it again.
exports.rejectSuggestedRetailer = async (id) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await pending(client, id);
    await client.query(
      `UPDATE suggested_retailers SET status = 'rejected', decided_at = NOW()
       WHERE suggested_retailer_id = $1`,
      [id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
