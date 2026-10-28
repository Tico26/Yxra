const { fetchProductById, fetchProductsByIds, searchProducts } = require("../models/products.models");
const { badRequest, notFound, parseId } = require("../lib/errors");
const { parseSearchSize, parseCategory, parseIds } = require("../lib/query");

exports.getProducts = async (req, res, next) => {
  try {
    if (req.query.ids !== undefined) {
      if (Object.keys(req.query).length > 1) throw badRequest("ids can't be combined with a search");
      const products = await fetchProductsByIds(parseIds(req.query.ids));
      return res.status(200).send({ products });
    }
    const products = await searchProducts({
      ...parseSearchSize(req.query),
      category: parseCategory(req.query.category),
      retailerId: req.query.retailer_id === undefined ? null : parseId(req.query.retailer_id, "Retailer"),
    });
    res.status(200).send({ products });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await fetchProductById(parseId(req.params.product_id, "Product"), { shoppableOnly: true });
    if (!product) throw notFound("Product");
    res.status(200).send({ product });
  } catch (err) {
    next(err);
  }
};
