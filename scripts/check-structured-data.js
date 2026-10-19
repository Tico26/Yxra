// One-off check for the launch map (issue #44): for each big Retailer, find
// one Product page through its sitemaps and see whether parseProductPage can
// read it. Uses the polite fetcher, so robots.txt is honoured.
// Usage: YXRA_CONTACT=... node scripts/check-structured-data.js
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");
const { parseProductPage } = require("../lib/collect/structured-data");

const RETAILERS = [
  { name: "Yours", site: "https://www.yoursclothing.co.uk", sitemap: /product|pdp/i, page: /yoursclothing\.co\.uk\/.+/i },
  { name: "ASOS", site: "https://www.asos.com", sitemap: /product|prd|women/i, page: /\/prd\//i },
  { name: "Simply Be", site: "https://www.simplybe.co.uk", sitemap: /pdp/i, page: /simplybe\.co\.uk\/.+/i },
  { name: "JD Williams", site: "https://www.jdwilliams.co.uk", sitemap: /pdp/i, page: /jdwilliams\.co\.uk\/.+/i },
  { name: "River Island", site: "https://www.riverisland.com", sitemap: /products-sitemap-women/i, page: /riverisland\.com\/.+/i },
  { name: "Ulla Popken", site: "https://www.ullapopken.co.uk", sitemap: /category/i, page: /ullapopken\.co\.uk\/.+\/\d{5,}/i },
];

const MAX_SITEMAPS = 6;

const locs = (xml, tag) =>
  [...xml.matchAll(new RegExp(`<${tag}>[\\s\\S]*?<loc>\\s*([^<\\s]+)\\s*</loc>`, "gi"))].map((m) =>
    m[1].replace(/&amp;/g, "&")
  );

const jsonLdTypes = (html) => {
  const types = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const [, body] of html.matchAll(pattern)) {
    try {
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          if (n["@type"]) types.push([].concat(n["@type"]).join("/"));
          (n["@graph"] || []).forEach(walk);
        }
      };
      walk(JSON.parse(body.trim()));
    } catch {
      types.push("(broken block)");
    }
  }
  return types;
};

const findPage = async (r, fetcher) => {
  const queue = [...(await fetcher.sitemapsFor(r.site))];
  if (!queue.length) queue.push(`${r.site}/sitemap.xml`);
  const seen = new Set();
  while (queue.length && seen.size < MAX_SITEMAPS) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const xml = await fetcher.getText(url);
    const children = locs(xml, "sitemap");
    queue.unshift(...children.filter((c) => r.sitemap.test(c)));
    const page = locs(xml, "url").find((u) => r.page.test(u));
    if (page && (r.sitemap.test(url) || !children.length)) return { page, sitemaps: [...seen] };
  }
  return { page: null, sitemaps: [...seen] };
};

const main = async () => {
  const fetcher = createPoliteFetcher({ minDelayMs: 3000 });
  for (const r of RETAILERS) {
    console.log(`\n=== ${r.name} ===`);
    try {
      const { page, sitemaps } = await findPage(r, fetcher);
      console.log(`sitemaps read: ${sitemaps.join(", ")}`);
      if (!page) {
        console.log("RESULT: no Product page found in the sitemaps read");
        continue;
      }
      console.log(`page: ${page}`);
      const html = await fetcher.getText(page);
      console.log(`html bytes: ${html.length}`);
      console.log(`json-ld types: ${jsonLdTypes(html).join(", ") || "(none)"}`);
      const products = parseProductPage(html, page);
      console.log(`RESULT: ${products.length} Product(s) parsed`);
      for (const p of products.slice(0, 2)) {
        const inStock = p.sizes.filter((s) => s.in_stock).length;
        console.log(
          `  ${p.title} | colour ${p.colour || "-"} | ${p.sizes.length} sizes (${inStock} in stock): ` +
            p.sizes.map((s) => s.size_label).join(", ")
        );
      }
    } catch (err) {
      console.log(`RESULT: failed: ${err.message}`);
    }
  }
};

main();
