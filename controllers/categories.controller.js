const {
  fetchCategories,
  fetchCategoryById,
  postCategory,
  patchCategory,
  deleteCategory,
} = require("../models/categories.models");
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
    const { category_id } = req.params;
    const category = await fetchCategoryById(category_id);
    res.status(200).send({ category });
  } catch (err) {
    next(err);
  }
};
exports.addCategory = async (req, res, next) => {
  try {
    const { category_name, category_description } = req.body;
    const category = await postCategory(category_name, category_description);
    res.status(201).send({ category });
  } catch (err) {
    next(err);
  }
};
exports.updateCategory = async (req, res, next) => {
  try {
    const { category_id } = req.params;
    const { category_name, category_description } = req.body;
    const category = await patchCategory(
      category_id,
      category_name,
      category_description
    );
    res.status(200).send({ category });
  } catch (err) {
    next(err);
  }
};
exports.removeCategory = async (req, res, next) => {
  try {
    const { category_id } = req.params;
    await deleteCategory(category_id);
    res.status(200).send("Successfully delete category");
  } catch (err) {
    next(err);
  }
};
