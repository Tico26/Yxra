const { fetchShops, fetchShopById } = require("../models/shops.models");

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
exports.addShop = () => {};
exports.updateShop = () => {};
exports.removeShop = () => {};
