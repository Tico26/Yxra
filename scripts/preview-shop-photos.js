// Shows which photo category each Retailer would get (lib/shop-photos.js),
// reading only the live site's public API and the Retailers' own sites.
// Writes nothing.
//   node scripts/preview-shop-photos.js [https://amaraspick.com]
const { categorise, measurePhoto, photoToFetch } = require("../lib/shop-photos");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const SITE = (process.argv[2] || "https://amaraspick.com").replace(/\/$/, "");
const SAMPLE_SIZE = 30;

const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);

// Shopify shops list their photos in their public product file; other shops'
// counts come from the Stock check once this is live.
const photoCounts = async (retailer, fetcher) => {
  if (retailer.source !== "shopify") return [];
  const site = retailer.site_url.replace(/\/$/, "");
  const body = await fetcher.getJson(`${site}/products.json?limit=250&page=1`);
  return (body.products || []).map((p) => (p.images || []).length);
};

const main = async () => {
  const fetcher = createPoliteFetcher({ minDelayMs: 1000 });
  const api = async (path) => (await fetch(`${SITE}/api${path}`)).json();
  const { retailers } = await api("/retailers");
  const lines = [];
  for (const retailer of retailers) {
    const { products = [] } = await api(`/products?retailer_id=${retailer.retailer_id}`);
    const photos = [];
    for (const p of pick(products.filter((p) => p.image_url), SAMPLE_SIZE)) {
      try {
        photos.push(await measurePhoto(await fetcher.getBytes(photoToFetch(p.image_url))));
      } catch (err) {
        // Skipped, as in the weekly check.
      }
    }
    let counts = [];
    try {
      counts = await photoCounts(retailer, fetcher);
    } catch (err) {
      // Not counted.
    }
    const result = categorise(photos, counts);
    const line = `${retailer.retailer_name} (${retailer.source}, ${products.length} products): ${
      result ? `${result.category.toUpperCase()}: ${result.note}` : `not judged, only ${photos.length} photos read`
    }`;
    console.log(line);
    lines.push(line);
  }
  console.log("\n=== Summary ===\n" + lines.join("\n"));
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
