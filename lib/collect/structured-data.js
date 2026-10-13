// Reads Retailers that are not on Shopify: finds product pages through the
// site's sitemaps and reads the schema.org Product data on each page (spec
// build step 9). Each colour becomes its own Product (R3).
const { htmlToText } = require("./html");

const MAX_SITEMAPS = 50;
const MAX_PAGES = 5000;

const IN_STOCK = /(InStock|LimitedAvailability|OnlineOnly)$/i;

const locs = (xml, tag) =>
  [...xml.matchAll(new RegExp(`<${tag}>[\\s\\S]*?<loc>\\s*([^<\\s]+)\\s*</loc>`, "gi"))].map(
    (m) => m[1].replace(/&amp;/g, "&")
  );

const parseSitemap = (xml) => ({ sitemaps: locs(xml, "sitemap"), urls: locs(xml, "url") });

const looksLikeProducts = (url) => /product/i.test(url);

// Walks sitemap indexes. When some child sitemaps are named for products,
// only those are read.
const findProductUrls = async (siteUrl, fetcher) => {
  const site = siteUrl.replace(/\/$/, "");
  const named = fetcher.sitemapsFor ? await fetcher.sitemapsFor(site) : [];
  const queue = named.length ? [...named] : [`${site}/sitemap.xml`];
  const seen = new Set();
  const urls = new Set();

  while (queue.length && seen.size < MAX_SITEMAPS) {
    const sitemapUrl = queue.shift();
    if (seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);
    const { sitemaps, urls: pageUrls } = parseSitemap(await fetcher.getText(sitemapUrl));
    const productSitemaps = sitemaps.filter(looksLikeProducts);
    queue.push(...(productSitemaps.length ? productSitemaps : sitemaps));
    pageUrls.forEach((u) => urls.add(u));
  }
  // Reading only some pages would mark the rest missing and delete them, so a
  // site this big fails loudly instead (it needs an affiliate feed).
  if (urls.size > MAX_PAGES) {
    throw new Error(`${urls.size} pages in the sitemaps, more than the ${MAX_PAGES} Yxra reads`);
  }
  return [...urls];
};

const jsonLdBlocks = (html) => {
  const blocks = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const [, body] of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(body.trim()));
    } catch {
      // A broken block on the page: skip it.
    }
  }
  return blocks;
};

const flatten = (node) => {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (node && typeof node === "object" && node["@graph"]) return flatten(node["@graph"]);
  return node && typeof node === "object" ? [node] : [];
};

const isType = (node, type) => [].concat(node["@type"] || []).includes(type);

const text = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return text(value.name || value["@value"] || null);
  const s = String(value).trim();
  return s || null;
};

const firstImage = (image) => {
  const first = [].concat(image || [])[0];
  if (!first) return null;
  return typeof first === "string" ? first : first.url || first.contentUrl || null;
};

const offersOf = (node) => [].concat(node.offers || []).flatMap((o) => (o.offers ? [].concat(o.offers) : [o]));

const variantInfo = (variant, page) => {
  const offers = offersOf(variant);
  const prices = offers.map((o) => Number(o.price || o.lowPrice)).filter((n) => n > 0);
  return {
    colour: text(variant.color),
    size: text(variant.size),
    in_stock: offers.some((o) => IN_STOCK.test(String(o.availability || ""))),
    ref: text(variant.sku) || text(variant.gtin) || text(variant.url) || page,
    image: firstImage(variant.image),
    url: text(variant.url) || text(offers[0] && offers[0].url) || page,
    price: prices.length ? Math.round(Math.min(...prices) * 100) : null,
  };
};

const toProducts = (group, variants, page) => {
  const byColour = new Map();
  for (const v of variants) {
    if (!v.size) continue;
    const key = (v.colour || "").toLowerCase();
    if (!byColour.has(key)) byColour.set(key, []);
    byColour.get(key).push(v);
  }
  const groupId =
    text(group.productGroupID) || text(group.sku) || new URL(page).pathname.replace(/\/$/, "");

  return [...byColour.entries()].map(([key, vs]) => {
    const sizes = new Map();
    for (const v of vs) {
      const size = sizes.get(v.size) || { size_label: v.size, in_stock: false, variant_refs: [] };
      size.in_stock = size.in_stock || v.in_stock;
      size.variant_refs.push(v.ref);
      sizes.set(v.size, size);
    }
    const prices = vs.map((v) => v.price).filter(Boolean);
    return {
      external_id: key ? `${groupId}:${key}` : groupId,
      title: text(group.name),
      description: htmlToText(text(group.description) || ""),
      brand: text(group.brand),
      colour: vs[0].colour,
      product_url: vs[0].url,
      image_url: (vs.find((v) => v.image) || {}).image || firstImage(group.image),
      price_in_pence: prices.length ? Math.min(...prices) : null,
      product_type: text(group.category),
      tags: [],
      sizes: [...sizes.values()],
    };
  });
};

const parseProductPage = (html, pageUrl) => {
  const nodes = jsonLdBlocks(html).flatMap(flatten);
  const groups = nodes.filter((n) => isType(n, "ProductGroup"));
  const inGroups = new Set(groups.flatMap((g) => [].concat(g.hasVariant || [])));
  const products = [];

  for (const group of groups) {
    const variants = [].concat(group.hasVariant || []).map((v) => variantInfo(v, pageUrl));
    products.push(...toProducts(group, variants, pageUrl));
  }
  for (const node of nodes.filter((n) => isType(n, "Product") && !inGroups.has(n))) {
    if (!text(node.name)) continue;
    products.push(...toProducts(node, [variantInfo(node, pageUrl)], pageUrl));
  }
  return products.filter((p) => p.title && p.sizes.length);
};

const readStructuredData = async (retailer, fetcher) => {
  const pages = await findProductUrls(retailer.site_url, fetcher);
  if (!pages.length) throw new Error("No product pages found in the sitemaps");

  const products = new Map();
  let failed = 0;
  for (const page of pages) {
    try {
      for (const p of parseProductPage(await fetcher.getText(page), page)) {
        if (!products.has(p.external_id)) products.set(p.external_id, p);
      }
    } catch {
      failed++;
    }
  }
  // When most pages fail, keep last night's data rather than hide everything (R6).
  if (failed > pages.length / 2) {
    throw new Error(`${failed} of ${pages.length} product pages failed to load`);
  }
  return [...products.values()];
};

// Live check: reads the Product's own page again.
const liveCheckStructuredData = async (product, sizes, fetcher) => {
  const found = parseProductPage(await fetcher.getText(product.product_url), product.product_url);
  const current = found.find((p) => p.external_id === product.external_id);
  if (!current) throw new Error("The Product is no longer on its page");
  const inStock = new Map();
  for (const size of current.sizes) {
    for (const ref of size.variant_refs) inStock.set(ref, size.in_stock);
  }
  const result = new Map();
  for (const size of sizes) {
    const known = size.variant_refs.filter((ref) => inStock.has(ref));
    if (known.length) result.set(size.size_label, known.some((ref) => inStock.get(ref)));
  }
  if (!result.size) throw new Error("None of the Product's sizes were found");
  return result;
};

module.exports = {
  parseSitemap,
  findProductUrls,
  parseProductPage,
  readStructuredData,
  liveCheckStructuredData,
};
