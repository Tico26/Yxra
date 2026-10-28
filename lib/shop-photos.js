// The weekly shop photo check (Tico, 28 Oct 2026): each Retailer's photos are
// judged as a whole and the Retailer is put in one of two categories. A
// studio catalogue Retailer passes every check below; a mixed one fails at
// least one. Studio Retailers' Products come first in the product list
// (lib/product-order.js). The same checks apply to every Retailer, so none can
// pay to be placed higher.
//
// The checks, on up to 30 of its shown Products picked at random:
//   same shape    at least 80% of the main photos have one shape (height / width)
//   big enough    at least 80% are 800px wide or more
//   several       its Products show 3 or more photos on average
//   plain         at least 80% have plain corners (one even colour)
// Free: no AI, only the photos and what the Stock check already collects.
const sharp = require("sharp");
const db = require("../db/connection");

const SAMPLE_SIZE = 30;
// Fewer photos than this could be read: the Retailer is left as it was.
const MIN_MEASURED = 10;
const SHARE_NEEDED = 0.8;
const MIN_WIDTH = 800;
const MIN_AVERAGE_PHOTOS = 3;
const RECHECK_AFTER_DAYS = 7;

// Shopify's image CDN sends a smaller copy on request, never larger than the
// photo itself, so a copy 1000px wide still tells whether it is 800px or more.
const photoToFetch = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    if (url.hostname === "cdn.shopify.com" || url.pathname.includes("/cdn/shop/")) {
      url.searchParams.set("width", "1000");
    }
    return url.toString();
  } catch {
    return imageUrl;
  }
};

// A corner is plain when its colour hardly varies; the four corners are one
// even colour when they are also close to each other.
const GRID = 40;
const PATCH = 5;
const MAX_SPREAD_IN_CORNER = 12;
const MAX_GAP_BETWEEN_CORNERS = 30;

const cornerStats = (pixels, x0, y0) => {
  const values = [[], [], []];
  for (let y = y0; y < y0 + PATCH; y++) {
    for (let x = x0; x < x0 + PATCH; x++) {
      const i = (y * GRID + x) * 3;
      for (let c = 0; c < 3; c++) values[c].push(pixels[i + c]);
    }
  }
  const mean = values.map((v) => v.reduce((a, b) => a + b, 0) / v.length);
  const spread = Math.max(
    ...values.map((v, c) => Math.sqrt(v.reduce((a, b) => a + (b - mean[c]) ** 2, 0) / v.length))
  );
  return { mean, spread };
};

const plainCorners = (pixels) => {
  const far = GRID - PATCH;
  const corners = [
    [0, 0],
    [far, 0],
    [0, far],
    [far, far],
  ].map(([x, y]) => cornerStats(pixels, x, y));
  if (corners.some((c) => c.spread > MAX_SPREAD_IN_CORNER)) return false;
  for (let c = 0; c < 3; c++) {
    const means = corners.map((corner) => corner.mean[c]);
    if (Math.max(...means) - Math.min(...means) > MAX_GAP_BETWEEN_CORNERS) return false;
  }
  return true;
};

// Width, height and whether the corners are plain, from a photo's bytes.
const measurePhoto = async (bytes) => {
  const image = sharp(bytes, { failOn: "none" });
  const { width, height } = await image.metadata();
  const pixels = await image
    .clone()
    .flatten({ background: "#ffffff" })
    .resize(GRID, GRID, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  return { width, height, plain: plainCorners(pixels) };
};

const share = (list, test) => list.filter(test).length / list.length;
const shapeOf = ({ width, height }) => Math.round((height / width) * 10) / 10;

// Puts a Retailer in a category from its measured photos and its Products'
// photo counts. null: too few photos could be read to judge.
const categorise = (photos, photoCounts) => {
  if (photos.length < MIN_MEASURED) return null;
  const shapes = new Map();
  for (const p of photos) shapes.set(shapeOf(p), (shapes.get(shapeOf(p)) || 0) + 1);
  const sameShape = Math.max(...shapes.values()) / photos.length;
  const bigEnough = share(photos, (p) => p.width >= MIN_WIDTH);
  const plain = share(photos, (p) => p.plain);
  const counted = photoCounts.filter((n) => n !== null && n !== undefined);
  const averagePhotos = counted.length ? counted.reduce((a, b) => a + b, 0) / counted.length : null;

  const percent = (n) => `${Math.round(n * 100)}%`;
  const checks = [
    ["same shape", sameShape >= SHARE_NEEDED, percent(sameShape)],
    ["big enough", bigEnough >= SHARE_NEEDED, percent(bigEnough)],
    [
      "several photos",
      averagePhotos !== null && averagePhotos >= MIN_AVERAGE_PHOTOS,
      averagePhotos === null ? "not counted yet" : `${averagePhotos.toFixed(1)} on average`,
    ],
    ["plain background", plain >= SHARE_NEEDED, percent(plain)],
  ];
  const failed = checks.filter(([, passed]) => !passed);
  const note =
    `${photos.length} photos: ` + checks.map(([name, passed, value]) => `${name} ${value}${passed ? "" : " (fails)"}`).join(", ");
  return { category: failed.length ? "mixed" : "studio", note };
};

// Up to SAMPLE_SIZE of the Retailer's shown Products with a photo, at random.
const sampleProducts = async (retailerId) => {
  const { rows } = await db.query(
    `SELECT product_id, image_url, photo_count FROM products
     WHERE retailer_id = $1 AND sort_status = 'shown' AND missing_since IS NULL
       AND image_url IS NOT NULL
     ORDER BY random() LIMIT $2`,
    [retailerId, SAMPLE_SIZE]
  );
  return rows;
};

const checkRetailer = async (retailer, { fetcher, measure = measurePhoto, log = console.log }) => {
  const products = await sampleProducts(retailer.retailer_id);
  const photos = [];
  for (const p of products) {
    try {
      photos.push(await measure(await fetcher.getBytes(photoToFetch(p.image_url))));
    } catch (err) {
      log(`Shop photos: ${retailer.retailer_name}: skipped a photo (${err.message})`);
    }
  }
  const result = categorise(photos, products.map((p) => p.photo_count));
  if (!result) {
    log(`Shop photos: ${retailer.retailer_name}: only ${photos.length} photos could be read; left as it was`);
    return null;
  }
  await db.query(
    `UPDATE retailers SET photo_category = $2, photo_check_note = $3, photo_checked_at = NOW()
     WHERE retailer_id = $1`,
    [retailer.retailer_id, result.category, result.note]
  );
  log(`Shop photos: ${retailer.retailer_name}: ${result.category} (${result.note})`);
  return result.category;
};

// Every current Retailer not checked in the last week, or all of them with
// everyone: true. One Retailer failing never stops the others.
const runShopPhotoCheck = async ({ fetcher, measure, log = console.log, everyone = false }) => {
  const { rows: due } = await db.query(
    `SELECT retailer_id, retailer_name FROM retailers
     WHERE removed_at IS NULL
       AND ($1 OR photo_checked_at IS NULL OR photo_checked_at < NOW() - make_interval(days => $2))
     ORDER BY retailer_id`,
    [everyone, RECHECK_AFTER_DAYS]
  );
  const summary = { studio: [], mixed: [], unjudged: [] };
  for (const retailer of due) {
    try {
      const category = await checkRetailer(retailer, { fetcher, measure, log });
      summary[category || "unjudged"].push(retailer.retailer_name);
    } catch (err) {
      log(`Shop photos: ${retailer.retailer_name} failed: ${err.message}`);
      summary.unjudged.push(retailer.retailer_name);
    }
  }
  return summary;
};

module.exports = { runShopPhotoCheck, categorise, measurePhoto, photoToFetch, plainCorners };
