const { clickOut } = require("../models/click-outs.models");
const { parseId } = require("../lib/errors");
const { parseSize } = require("../lib/query");

exports.postClickOut = async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await clickOut({
      productId: parseId(body.product_id, "Product"),
      ...parseSize(body),
    });
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
};
