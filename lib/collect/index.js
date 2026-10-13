// Collects a Retailer's Products from the source recorded on it (R2).
const { readShopify } = require("./shopify");
const { saveRetailerProducts } = require("../catalogue");

const readers = { shopify: readShopify };

const readerFor = (retailer) => {
  const reader = readers[retailer.source];
  if (!reader) throw new Error(`No reader for source "${retailer.source}"`);
  return reader;
};

const collectRetailer = async (retailer, { fetcher, now = new Date() }) => {
  if (retailer.removed_at) throw new Error(`${retailer.retailer_name} has been removed`);
  const products = await readerFor(retailer)(retailer, fetcher);
  return saveRetailerProducts(retailer, products, now);
};

module.exports = { collectRetailer, readers };

const liveChecks = { shopify: require("./shopify").liveCheckShopify };
module.exports.liveChecks = liveChecks;
