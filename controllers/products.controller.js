const {
  fetchProducts,
  fetchProductById,
  postProduct,
  patchProduct,
  deleteProduct,
} = require("../models/products.models");

exports.getAllProducts = (req, res, next) => {
  fetchProducts()
    .then((products) => {
      res.status(200).send({ products });
    })
    .catch(next);
};

exports.getProductById = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const specificProduct = await fetchProductById(product_id);
    res.status(200).send({ specificProduct });
  } catch (err) {
    next(err);
  }
};

exports.addProduct = async (req, res, next) => {
  try {
    const {
      product_url,
      image,
      product_name,
      price_in_pence,
      product_description,
      size,
      colour,
      product_category,
      shop_id,
    } = req.body;
    const newProduct = await postProduct(
      product_url,
      image,
      product_name,
      price_in_pence,
      product_description,
      size,
      colour,
      product_category,
      shop_id
    );
    res.status(201).send({ newProduct });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    const {
      product_url,
      image,
      product_name,
      price_in_pence,
      product_desciption,
      size,
      colour,
      product_category,
      shop_id,
    } = req.body;
    const updatedProduct = await patchProduct(
      product_id,
      product_url,
      image,
      product_name,
      price_in_pence,
      product_desciption,
      size,
      colour,
      product_category,
      shop_id
    );
    res.status(200).send({ updatedProduct });
  } catch (err) {
    next(err);
  }
};

exports.removeProduct = async (req, res, next) => {
  const { product_id } = req.params;

  await deleteProduct(product_id);
  res.status(200).send("Successfully Deleted");
};
