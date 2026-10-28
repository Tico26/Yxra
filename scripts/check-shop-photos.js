// Puts each Retailer not checked in the last week in a photo category
// (lib/shop-photos.js): the Stock check's step before the product order.
//   npm run check-shop-photos              (Retailers due a check)
//   npm run check-shop-photos -- --all     (every current Retailer)
const db = require("../db/connection");
const { runShopPhotoCheck } = require("../lib/shop-photos");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const main = async () => {
  // Photos come from image CDNs, which can take requests closer together.
  const fetcher = createPoliteFetcher({ minDelayMs: 1000 });
  const summary = await runShopPhotoCheck({ fetcher, everyone: process.argv.includes("--all") });
  console.log(
    `Shop photos done: ${summary.studio.length} studio, ${summary.mixed.length} mixed, ` +
      `${summary.unjudged.length} not judged`
  );
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
