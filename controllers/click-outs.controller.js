const { clickOut } = require("../models/click-outs.models");
const { parseId } = require("../lib/errors");
const { parseUkSize } = require("../lib/query");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const LIVE_CHECK_TIMEOUT_MS = 2500;

let defaultFetcher;
// Live checks are single requests made while a Shopper waits, so they skip
// the pause between requests but still honour robots.txt and identify Yxra.
const liveFetcher = (app) => {
  if (app.get("liveFetcher")) return app.get("liveFetcher");
  if (!defaultFetcher) {
    try {
      defaultFetcher = createPoliteFetcher({ minDelayMs: 0, timeoutMs: LIVE_CHECK_TIMEOUT_MS });
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
