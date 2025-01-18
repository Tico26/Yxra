const {
  fetchShops,
  fetchShopById,
  postShop,
  patchShop,
} = require("../models/shops.models");

exports.getAllShops = async (req, res, next) => {
  try {
    const allShops = await fetchShops();
    res.status(200).send(allShops);
  } catch (err) {
    next(err);
  }
};
exports.getShopById = async (req, res, next) => {
  try {
    const { shop_id } = req.params;
    const shop = await fetchShopById(shop_id);
    res.status(200).send(shop);
  } catch (err) {
    next(err);
  }
};
exports.addShop = async (req, res, next) => {
  try {
    const { shop_name, shop_url, location, category_id } = req.body;
    const shop = await postShop(shop_name, shop_url, location, category_id);
    res.status(201).send(shop);
  } catch (err) {
    next(err);
  }
};
exports.updateShop = async (req, res, next) => {
  try {
    const { shop_id } = req.params;
    const { shop_name, shop_url, location, category_id } = req.body;
    const shop = await patchShop(
      shop_id,
      shop_name,
      shop_url,
      location,
      category_id
    );
    res.status(200).send(shop);
  } catch (err) {
    next(err);
  }
};
exports.removeShop = () => {};
