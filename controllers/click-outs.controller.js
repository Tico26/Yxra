const { clickOut } = require("../models/click-outs.models");
const { parseId } = require("../lib/errors");
const { parseUkSize } = require("../lib/query");

exports.postClickOut = async (req, res, next) => {
  try {
    const { product_id, uk_size } = req.body || {};
    const result = await clickOut({
      productId: parseId(product_id, "Product"),
      ukSize: parseUkSize(uk_size),
    });
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
};
