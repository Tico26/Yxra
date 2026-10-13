// Collects a Retailer's Products from the source recorded on it (R2).
const { readShopify, liveCheckShopify } = require("./shopify");
const { readStructuredData, liveCheckStructuredData } = require("./structured-data");
const { saveRetailerProducts } = require("../catalogue");

const readers = { shopify: readShopify, structured_data: readStructuredData };

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

const liveChecks = { shopify: liveCheckShopify, structured_data: liveCheckStructuredData };

module.exports = { collectRetailer, readers, liveChecks };
