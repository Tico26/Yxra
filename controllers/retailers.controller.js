const { fetchRetailers, addRetailer, removeRetailer } = require("../models/retailers.models");
const { notFound, parseId } = require("../lib/errors");

exports.getRetailers = async (req, res, next) => {
  try {
    res.status(200).send({ retailers: await fetchRetailers() });
  } catch (err) {
    next(err);
  }
};

exports.postRetailer = async (req, res, next) => {
  try {
    res.status(201).send({ retailer: await addRetailer(req.body || {}) });
  } catch (err) {
    next(err);
  }
};

exports.deleteRetailer = async (req, res, next) => {
  try {
    if (!(await removeRetailer(parseId(req.params.retailer_id, "Retailer")))) {
      throw notFound("Retailer");
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
