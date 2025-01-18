const express = require("express");

const app = express();
app.use(express.json());
const {
  getAllShops,
  getShopById,
  addShop,
  updateShop,
  removeShop,
} = require("./controllers/shops.controller");
const {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  removeProduct,
} = require("./controllers/products.controller");
const {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  removeCategory,
} = require("./controllers/categories.controller");

app.get("/api/products", getAllProducts);
app.get("/api/products/:product_id", getProductById);
app.post("/api/products", addProduct);
app.patch("/api/products/:product_id", updateProduct);
app.delete("/api/products/:product_id", removeProduct);

app.get("/api/shops", getAllShops);
app.get("/api/shops/:shop_id", getShopById);
app.post("/api/shops", addShop);
app.patch("/api/shops/:shop_id", updateShop);
app.delete("/api/shops/:shop_id", removeShop);

app.get("/api/categories", getAllCategories);
app.get("/api/categories/:category_id", getCategoryById);
app.post("/api/categories", addCategory);
app.patch("/api/categories/:category_id", updateCategory);
app.delete("/api/categories/:category_id", removeCategory);

module.exports = { app };
