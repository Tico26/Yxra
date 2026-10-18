const { clickOut } = require("../models/click-outs.models");
const { parseId } = require("../lib/errors");
const { parseUkSize } = require("../lib/query");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const LIVE_CHECK_TIMEOUT_MS = 2500;

let defaultFetcher;
// Live checks are made while a Shopper waits, so the pause between requests
// to one Retailer is short. When Shoppers click faster than that, the wait
// runs past the timeout and she is sent on unchecked (R20) rather than
// hammering the Retailer. robots.txt and identifying Yxra still apply.
const liveFetcher = (app) => {
  if (app.get("liveFetcher")) return app.get("liveFetcher");
  if (!defaultFetcher) {
    try {
      defaultFetcher = createPoliteFetcher({ minDelayMs: 1000, timeoutMs: LIVE_CHECK_TIMEOUT_MS });
    } catch {
      return null; // No contact address set: Shoppers are sent on unchecked (R20).
    }
  }
  return defaultFetcher;
};

exports.postClickOut = async (req, res, next) => {
  try {
    const { product_id, uk_size } = req.body || {};
    const result = await clickOut({
      productId: parseId(product_id, "Product"),
      ukSize: parseUkSize(uk_size),
      fetcher: liveFetcher(req.app),
      timeoutMs: req.app.get("liveCheckTimeoutMs") || LIVE_CHECK_TIMEOUT_MS,
    });
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
};
