const { fetchCategories, fetchCategoryById } = require("../models/categories.models");
const { notFound, parseId } = require("../lib/errors");

exports.getAllCategories = async (req, res, next) => {
  try {
    const allCategories = await fetchCategories();
    res.status(200).send({ allCategories });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await fetchCategoryById(parseId(req.params.category_id, "Category"));
    if (!category) throw notFound("Category");
    res.status(200).send({ category });
  } catch (err) {
    next(err);
  }
};
