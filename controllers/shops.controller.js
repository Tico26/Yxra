const { fetchShops } = require("../models/shops.models");

exports.getAllShops = async (req, res, next) => {
  try {
    const allShops = await fetchShops();
    res.status(200).send(allShops);
  } catch (err) {
    next(err);
  }
};
exports.getShopById = () => {};
exports.addShop = () => {};
exports.updateShop = () => {};
exports.removeShop = () => {};
