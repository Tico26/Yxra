const { fetchProductById } = require("../models/products.models");
const { notFound, parseId } = require("../lib/errors");

exports.getProductById = async (req, res, next) => {
  try {
    const product = await fetchProductById(parseId(req.params.product_id, "Product"));
    if (!product) throw notFound("Product");
    res.status(200).send({ product });
  } catch (err) {
    next(err);
  }
};
