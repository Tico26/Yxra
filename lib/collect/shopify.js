// Reads a Shopify Retailer's public product data (/products.json) and turns
// it into Products: one per colour, each with its Size labels and stock.
const { htmlToText } = require("./html");

const MAX_PAGES = 200;

const optionIndex = (product, pattern) => {
  const option = (product.options || []).find((o) => pattern.test(o.name));
  return option ? option.position : null;
};

const optionValue = (variant, position) => (position ? variant[`option${position}`] : null);

const toPence = (price) => Math.round(Number(price) * 100);

const imageFor = (product, variants) => {
  const featured = variants.find((v) => v.featured_image && v.featured_image.src);
  if (featured) return featured.featured_image.src;
  const ids = new Set(variants.map((v) => v.id));
  const linked = (product.images || []).find((img) =>
    (img.variant_ids || []).some((id) => ids.has(id))
  );
  if (linked) return linked.src;
  return product.images && product.images[0] ? product.images[0].src : null;
};

const parseShopifyProducts = (shopifyProducts, siteUrl) => {
  const site = siteUrl.replace(/\/$/, "");
  const products = [];

  for (const product of shopifyProducts) {
    const colourAt = optionIndex(product, /^colou?r$/i);
    const sizeAt = optionIndex(product, /size/i);
    if (!sizeAt) continue;

    const byColour = new Map();
    for (const variant of product.variants || []) {
      const colour = optionValue(variant, colourAt);
      if (!byColour.has(colour)) byColour.set(colour, []);
      byColour.get(colour).push(variant);
    }

    for (const [colour, variants] of byColour) {
      const sizes = new Map();
      for (const variant of variants) {
        const label = optionValue(variant, sizeAt);
        if (!label) continue;
        const size = sizes.get(label) || { size_label: label, in_stock: false, variant_refs: [] };
        size.in_stock = size.in_stock || Boolean(variant.available);
        size.variant_refs.push(String(variant.id));
        sizes.set(label, size);
      }
      if (!sizes.size) continue;

      products.push({
        external_id: colour ? `${product.id}:${colour.toLowerCase()}` : String(product.id),
        title: product.title,
        description: htmlToText(product.body_html),
        brand: product.vendor || null,
        colour,
        product_url: `${site}/products/${product.handle}?variant=${variants[0].id}`,
        image_url: imageFor(product, variants),
        price_in_pence: Math.min(...variants.map((v) => toPence(v.price))),
        product_type: product.product_type || null,
        tags: Array.isArray(product.tags)
          ? product.tags
          : String(product.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        sizes: [...sizes.values()],
      });
    }
  }
  return products;
};

const readShopify = async (retailer, fetcher) => {
  const site = retailer.site_url.replace(/\/$/, "");
  const products = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await fetcher.getJson(`${site}/products.json?limit=250&page=${page}`);
    if (!body.products || body.products.length === 0) break;
    products.push(...parseShopifyProducts(body.products, site));
  }
  return products;
};

module.exports = { parseShopifyProducts, readShopify };

// Live check: asks Shopify for one product's variants right now and returns
// whether each Size label is in stock, keyed by label.
const liveCheckShopify = async (product, sizes, fetcher) => {
  const url = new URL(product.product_url);
  const handle = url.pathname.match(/\/products\/([^/]+)/);
  if (!handle) throw new Error(`Cannot find the Shopify handle in ${product.product_url}`);
  const live = await fetcher.getJson(`${url.origin}/products/${handle[1]}.js`);
  const available = new Map((live.variants || []).map((v) => [String(v.id), Boolean(v.available)]));

  const result = new Map();
  for (const size of sizes) {
    const known = size.variant_refs.filter((ref) => available.has(ref));
    if (known.length) result.set(size.size_label, known.some((ref) => available.get(ref)));
  }
  if (!result.size) throw new Error("None of the Product's variants were found");
  return result;
};

module.exports.liveCheckShopify = liveCheckShopify;
