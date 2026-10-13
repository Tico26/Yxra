const express = require("express");
const { handleErrors, notFound } = require("./lib/errors");
const { getProducts, getProductById } = require("./controllers/products.controller");
const {
  getRetailers,
  postRetailer,
  deleteRetailer,
} = require("./controllers/retailers.controller");
const { requireAdmin } = require("./lib/admin");
const {
  getAllCategories,
  getCategoryById,
} = require("./controllers/categories.controller");

const app = express();
app.use(express.json());

app.get("/api/products", getProducts);
app.get("/api/products/:product_id", getProductById);

app.get("/api/retailers", getRetailers);
app.post("/api/retailers", requireAdmin, postRetailer);
app.delete("/api/retailers/:retailer_id", requireAdmin, deleteRetailer);

app.get("/api/categories", getAllCategories);
app.get("/api/categories/:category_id", getCategoryById);

app.all("/api/*", (req, res, next) => next(notFound("Endpoint")));
app.use(handleErrors);

module.exports = { app };
