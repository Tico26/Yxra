// Adds a Retailer so it is collected from now on.
//   npm run add-retailer -- "Retailer name" https://www.example.co.uk shopify [--women-only]
const db = require("../db/connection");
const { addRetailer } = require("../models/retailers.models");

const main = async () => {
  const [name, siteUrl, source = "shopify", ...flags] = process.argv.slice(2);
  if (!name || !siteUrl) {
    throw new Error(
      'Usage: npm run add-retailer -- "Name" https://site shopify|structured_data [--women-only]'
    );
  }
  const retailer = await addRetailer({
    retailer_name: name,
    site_url: siteUrl,
    source,
    women_only: flags.includes("--women-only"),
  });
  console.log(`Added ${retailer.retailer_name} (retailer_id ${retailer.retailer_id})`);
};

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
