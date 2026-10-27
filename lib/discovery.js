// Discovery (spec build step 8, rules R22–R23): finds UK online Retailers
// selling plus-size clothes and adds the ones Amara's Pick can read as Suggested
// Retailers.
// It never adds a Retailer itself; Tico approves or rejects each one.
const db = require("../db/connection");
const { normaliseSiteUrl } = require("./sites");
const { findProductUrls, parseProductPage } = require("./collect/structured-data");

// www.example.co.uk and example.co.uk are the same Retailer.
const siteKey = (siteUrl) => new URL(siteUrl).hostname.replace(/^www\./, "");

const knownSiteKeys = async () => {
  const { rows } = await db.query(
    `SELECT site_url FROM retailers UNION SELECT site_url FROM suggested_retailers`
  );
  return new Set(rows.map((r) => siteKey(r.site_url)));
};

// Which source Amara's Pick would read the site with, or null if neither works.
const detectSource = async (site, fetcher) => {
  try {
    const body = await fetcher.getJson(`${site}/products.json?limit=1`);
    if (Array.isArray(body.products) && body.products.length) return "shopify";
  } catch {
    // Not Shopify, or not open to us.
  }
  try {
    const pages = (await findProductUrls(site, fetcher)).slice(0, 3);
    for (const page of pages) {
      if (parseProductPage(await fetcher.getText(page), page).length) return "structured_data";
    }
  } catch {
    // No readable sitemap.
  }
  return null;
};

const runDiscovery = async ({ finder, fetcher, log = console.log }) => {
  const known = await knownSiteKeys();
  const found = await finder.find({ knownSites: [...known] });
  let suggested = 0;

  for (const suggestion of found) {
    let site;
    try {
      site = normaliseSiteUrl(suggestion.site_url);
    } catch {
      continue;
    }
    if (known.has(siteKey(site))) continue;
    known.add(siteKey(site));

    const source = await detectSource(site, fetcher);
    if (!source) {
      log(`Discovery: skipped ${site} (no product data Amara's Pick can read)`);
      continue;
    }
    await db.query(
      `INSERT INTO suggested_retailers (retailer_name, site_url, source, found_via)
       VALUES ($1, $2, $3, $4) ON CONFLICT (site_url) DO NOTHING`,
      [String(suggestion.retailer_name || siteKey(site)).slice(0, 250), site, source, suggestion.found_via || null]
    );
    suggested++;
    log(`Discovery: suggested ${site} (${source})`);
  }
  log(`Discovery: ${found.length} sites found, ${suggested} new Suggested Retailers`);
  return { found: found.length, suggested };
};

module.exports = { runDiscovery, siteKey };
