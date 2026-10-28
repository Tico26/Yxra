const db = require("../db/connection");
const { badRequest } = require("../lib/errors");
const { normaliseSiteUrl, parseSource } = require("../lib/sites");
const { reopenWomenOnlyDefaults } = require("../lib/catalogue");

exports.fetchRetailers = async () => {
  const { rows } = await db.query(
    `SELECT * FROM retailers WHERE removed_at IS NULL ORDER BY retailer_name`
  );
  return rows;
};

// Adds a Retailer, or brings back one Tico removed earlier.
exports.addRetailer = async ({ retailer_name, site_url, source, women_only = false }, client = db) => {
  if (!retailer_name || typeof retailer_name !== "string") {
    throw badRequest("retailer_name is required");
  }
  const siteUrl = normaliseSiteUrl(site_url);
  const { rows: before } = await client.query(`SELECT women_only FROM retailers WHERE site_url = $1`, [
    siteUrl,
  ]);
  const { rows } = await client.query(
    `INSERT INTO retailers (retailer_name, site_url, source, women_only)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (site_url) DO UPDATE
     SET retailer_name = EXCLUDED.retailer_name, source = EXCLUDED.source,
         women_only = EXCLUDED.women_only, removed_at = NULL
     RETURNING *`,
    [retailer_name.trim(), siteUrl, parseSource(source), Boolean(women_only)]
  );
  if (before.length && before[0].women_only && !rows[0].women_only) {
    await reopenWomenOnlyDefaults(rows[0].retailer_id);
  }
  return rows[0];
};

// Hidden from search at once and never collected again; its Products are
// kept so bringing the Retailer back is instant.
exports.removeRetailer = async (retailerId) => {
  const { rowCount } = await db.query(
    `UPDATE retailers SET removed_at = NOW() WHERE retailer_id = $1 AND removed_at IS NULL`,
    [retailerId]
  );
  return rowCount > 0;
};
