// Loads one Retailer's Products into the database now.
//   npm run collect -- https://www.example-retailer.co.uk
//   npm run collect -- 3            (by retailer_id)
// The Retailer must already be added (npm run add-retailer, or the admin API).
const db = require("../db/connection");
const { collectRetailer } = require("../lib/collect");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const main = async () => {
  const which = process.argv[2];
  if (!which) throw new Error("Usage: npm run collect -- <site url or retailer id>");
  const { rows } = await db.query(
    /^\d+$/.test(which)
      ? `SELECT * FROM retailers WHERE retailer_id = $1`
      : `SELECT * FROM retailers WHERE site_url = $1`,
    [/^\d+$/.test(which) ? Number(which) : which.replace(/\/$/, "")]
  );
  if (!rows[0]) throw new Error(`${which} is not a Retailer yet. Add it first.`);

  const started = Date.now();
  const result = await collectRetailer(rows[0], { fetcher: createPoliteFetcher() });
  console.log(
    `${rows[0].retailer_name}: ${result.saved} Products saved, ${result.deleted} deleted ` +
      `in ${Math.round((Date.now() - started) / 1000)}s`
  );
};

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
