const { fetchProductById, searchProducts } = require("../models/products.models");
const { notFound, parseId } = require("../lib/errors");
const { parseUkSize, parseCategory } = require("../lib/query");

exports.getProducts = async (req, res, next) => {
  try {
    const products = await searchProducts({
      ukSize: parseUkSize(req.query.uk_size),
      category: parseCategory(req.query.category),
    });
    res.status(200).send({ products });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await fetchProductById(parseId(req.params.product_id, "Product"));
    if (!product) throw notFound("Product");
    res.status(200).send({ product });
  } catch (err) {
    next(err);
  }
};
