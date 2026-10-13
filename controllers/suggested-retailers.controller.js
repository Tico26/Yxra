const {
  approveSuggestedRetailer,
  rejectSuggestedRetailer,
} = require("../models/suggested-retailers.models");
const { parseId } = require("../lib/errors");

exports.postApprove = async (req, res, next) => {
  try {
    const id = parseId(req.params.suggested_retailer_id, "Suggested Retailer");
    const retailer = await approveSuggestedRetailer(id, {
      women_only: Boolean((req.body || {}).women_only),
    });
    res.status(201).send({ retailer });
  } catch (err) {
    next(err);
  }
};

exports.postReject = async (req, res, next) => {
  try {
    await rejectSuggestedRetailer(parseId(req.params.suggested_retailer_id, "Suggested Retailer"));
    res.status(200).send({ ok: true });
  } catch (err) {
    next(err);
  }
};
