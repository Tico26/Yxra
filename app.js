const path = require("path");
const express = require("express");
const { handleErrors, notFound } = require("./lib/errors");
const { getProducts, getProductById } = require("./controllers/products.controller");
const {
  getRetailers,
  postRetailer,
  deleteRetailer,
} = require("./controllers/retailers.controller");
const { requireAdmin } = require("./lib/admin");
const { postClickOut } = require("./controllers/click-outs.controller");
const {
  getReviewList,
  postSizeLabel,
  putSizeChart,
  postProductDecision,
} = require("./controllers/review.controller");
const {
  getAllCategories,
  getCategoryById,
} = require("./controllers/categories.controller");

const app = express();
app.use(express.json());

// Tico's Review list page. It holds no data itself: it asks for the admin
// token and calls the admin API.
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

app.get("/api/products", getProducts);
app.get("/api/products/:product_id", getProductById);

app.post("/api/click-outs", postClickOut);

app.get("/api/retailers", getRetailers);
app.post("/api/retailers", requireAdmin, postRetailer);
app.delete("/api/retailers/:retailer_id", requireAdmin, deleteRetailer);

app.get("/api/review", requireAdmin, getReviewList);
app.post("/api/review/size-labels", requireAdmin, postSizeLabel);
app.post("/api/review/products/:product_id", requireAdmin, postProductDecision);
app.put("/api/size-charts/:brand", requireAdmin, putSizeChart);

app.get("/api/categories", getAllCategories);
app.get("/api/categories/:category_id", getCategoryById);

app.all("/api/*", (req, res, next) => next(notFound("Endpoint")));
app.use(handleErrors);

module.exports = { app };
