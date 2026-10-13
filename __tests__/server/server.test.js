const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(() => seed(data));
afterAll(() => db.end());

const productId = async (externalId) => {
  const { rows } = await db.query(`SELECT product_id FROM products WHERE external_id = $1`, [
    externalId,
  ]);
  return rows[0].product_id;
};

describe("GET /api/categories", () => {
  test("200: responds with the launch categories", async () => {
    const {
      body: { allCategories },
    } = await request(app).get("/api/categories").expect(200);
    expect(allCategories.map((c) => c.category_name).sort()).toEqual([
      "activewear",
      "clothes",
      "swimwear",
    ]);
  });
});

describe("GET /api/products/:product_id", () => {
  test("200: a Product with three Size labels is one Product with three sizes", async () => {
    const id = await productId("101:black");
    const {
      body: { product },
    } = await request(app).get(`/api/products/${id}`).expect(200);
    expect(product).toMatchObject({
      title: "Wrap Midi Dress",
      colour: "Black",
      retailer_name: "Northern Curve",
      price_in_pence: 3500,
    });
    expect(product.sizes.map((s) => s.size_label)).toEqual(["18", "20", "22"]);
  });

  test("200: one Size label can map to more than one UK size", async () => {
    const id = await productId("202:navy");
    const {
      body: { product },
    } = await request(app).get(`/api/products/${id}`).expect(200);
    expect(product.sizes[0]).toMatchObject({ size_label: "18/20", uk_sizes: [18, 20] });
  });

  test("404: no such Product", () => request(app).get("/api/products/99999").expect(404));

  test("400: id is not a number", () => request(app).get("/api/products/abc").expect(400));
});

describe("GET /api/retailers", () => {
  test("200: each Retailer records its source", async () => {
    const {
      body: { retailers },
    } = await request(app).get("/api/retailers").expect(200);
    expect(retailers.length).toBeGreaterThan(0);
    retailers.forEach((r) => expect(r.source).toBe("shopify"));
  });
});
