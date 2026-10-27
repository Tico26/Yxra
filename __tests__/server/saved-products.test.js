// GET /api/products?ids= : the Products on a Saved page (spec 0004 rules 13
// and 14), sold out ones included, so the page can mark them.
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(() => seed(data));
afterAll(() => db.end());

const idOf = async (externalId) => {
  const { rows } = await db.query(`SELECT product_id FROM products WHERE external_id = $1`, [externalId]);
  return rows[0].product_id;
};

const saved = async (ids) => {
  const {
    body: { products },
  } = await request(app).get("/api/products").query({ ids: ids.join(",") }).expect(200);
  return products;
};

describe("GET /api/products?ids= (Saved page)", () => {
  test("returns the Products asked for, in the order asked", async () => {
    const shirt = await idOf("104:white");
    const dress = await idOf("101:black");
    const products = await saved([shirt, dress]);
    expect(products.map((p) => p.product_id)).toEqual([shirt, dress]);
    expect(products[1]).toMatchObject({
      title: "Wrap Midi Dress",
      retailer_name: "Northern Curve",
      in_stock_sizes: ["18", "22"],
      in_stock_uk_sizes: [18, 22],
    });
  });

  test("rule 13: a Product sold out in every size still comes back, with nothing in stock", async () => {
    const shirt = await idOf("104:white");
    const [product] = await saved([shirt]);
    expect(product).toMatchObject({ title: "Linen Shirt", in_stock_sizes: [], in_stock_uk_sizes: [] });
  });

  test("a Product gone from its Retailer's data counts as sold out until it is deleted", async () => {
    const cardigan = await idOf("107:pink");
    const [product] = await saved([cardigan]);
    expect(product).toMatchObject({ title: "Vanished Cardigan", in_stock_sizes: [], in_stock_uk_sizes: [] });
  });

  test("a Size label not yet translated never counts as in stock", async () => {
    const leggings = await idOf("203:black");
    const [product] = await saved([leggings]);
    expect(product.in_stock_sizes).toEqual(["20"]);
    expect(product.in_stock_uk_sizes).toEqual([20]);
  });

  test("rule 14: deleted Products, and ones a Shopper could no longer find, are left out", async () => {
    const dress = await idOf("101:black");
    const removedRetailer = await idOf("301:green");
    const excluded = await idOf("205:grey");
    const deleted = await idOf("101:red");
    await db.query(`DELETE FROM products WHERE product_id = $1`, [deleted]);
    const products = await saved([removedRetailer, deleted, dress, excluded, 99999]);
    expect(products.map((p) => p.product_id)).toEqual([dress]);
  });

  test("an id asked for twice comes back once", async () => {
    const dress = await idOf("101:black");
    expect((await saved([dress, dress])).length).toBe(1);
  });

  test("400: ids that are not numbers, too many ids, or ids with a size", async () => {
    await request(app).get("/api/products?ids=1,abc").expect(400);
    await request(app).get("/api/products?ids=").expect(400);
    const tooMany = Array.from({ length: 101 }, (_, i) => i + 1).join(",");
    await request(app).get(`/api/products?ids=${tooMany}`).expect(400);
    await request(app).get("/api/products?ids=1&uk_size=20").expect(400);
  });
});
