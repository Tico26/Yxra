const {
  fetchReviewList,
  settleSizeLabel,
  saveSizeChart,
  settleProduct,
} = require("../models/review.models");
const { parseId } = require("../lib/errors");

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

exports.getReviewList = handle(async (req, res) => {
  res.status(200).send(await fetchReviewList());
});

exports.postSizeLabel = handle(async (req, res) => {
  res.status(201).send({ translation: await settleSizeLabel(req.body || {}) });
});

exports.putSizeChart = handle(async (req, res) => {
  const sizes = await saveSizeChart(req.params.brand, (req.body || {}).sizes);
  res.status(200).send({ brand: req.params.brand, sizes });
});

exports.postProductDecision = handle(async (req, res) => {
  await settleProduct(parseId(req.params.product_id, "Product"), req.body || {});
  res.status(200).send({ ok: true });
});
