const { fetchRetailers } = require("../models/retailers.models");

exports.getRetailers = async (req, res, next) => {
  try {
    res.status(200).send({ retailers: await fetchRetailers() });
  } catch (err) {
    next(err);
  }
};
