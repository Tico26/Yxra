process.env.ADMIN_TOKEN = "test-admin-token";
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { collectRetailer } = require("../../lib/collect");
const page1 = require("../fixtures/shopify/products-page-1.json");

beforeEach(() => seed(data));
afterAll(() => db.end());

const ADMIN = { Authorization: "Bearer test-admin-token" };

const reviewList = async () => (await request(app).get("/api/review").set(ADMIN).expect(200)).body;

const search = async (query) =>
  (await request(app).get("/api/products").query(query).expect(200)).body.products;

describe("GET /api/review", () => {
  test("R12: an untranslated Size label sits on the Review list", async () => {
    const { size_labels } = await reviewList();
    expect(size_labels).toEqual([
      expect.objectContaining({ brand: "Seaside Plus", size_label: "3X", products: 1 }),
    ]);
  });

  test("lists Products the rules could not sort", async () => {
    const { products } = await reviewList();
    expect(products).toEqual([
      expect.objectContaining({ title: "The Weekender", retailer_name: "Seaside Plus" }),
    ]);
  });

  test("401: only Tico sees the Review list", () => request(app).get("/api/review").expect(401));
});

describe("POST /api/review/size-labels", () => {
  test("Tico settles a label: it is shown under its UK size and leaves the Review list", async () => {
    expect((await search({ uk_size: 26 })).map((p) => p.title)).not.toContain("High Waist Leggings");
    await request(app)
      .post("/api/review/size-labels")
      .set(ADMIN)
      .send({ brand: "Seaside Plus", size_label: "3X", uk_sizes: [26] })
      .expect(201);
    expect((await search({ uk_size: 26 })).map((p) => p.title)).toContain("High Waist Leggings");
    expect((await reviewList()).size_labels).toEqual([]);
  });

  test("once settled, the same label from the same Brand is translated automatically next time", async () => {
    await request(app)
      .post("/api/review/size-labels")
      .set(ADMIN)
      .send({ brand: "Northern Curve", size_label: "3x", uk_sizes: [26, 28] })
      .expect(201);
    const { rows } = await db.query(
      `INSERT INTO retailers (retailer_name, site_url, source, women_only)
       VALUES ('Fixture Shop', 'https://fixture-shop.example', 'shopify', TRUE) RETURNING *`
    );
    await collectRetailer(rows[0], { fetcher: { getJson: async (url) => (url.endsWith("page=1") ? page1 : { products: [] }) } });

    const vest = (await search({ uk_size: 28, category: "clothes" })).find((p) => p.title === "Ribbed Vest Top");
    expect(vest).toMatchObject({ size_label: "3X", fits: "fits 26–28" });
  });

  test("400: uk_sizes must be UK sizes", () =>
    request(app)
      .post("/api/review/size-labels")
      .set(ADMIN)
      .send({ brand: "Seaside Plus", size_label: "3X", uk_sizes: ["big"] })
      .expect(400));
});

describe("PUT /api/size-charts/:brand", () => {
  test("R11: the Brand's size chart is used before the rules", async () => {
    await request(app)
      .put(`/api/size-charts/${encodeURIComponent("Northern Curve")}`)
      .set(ADMIN)
      .send({ sizes: [{ size_label: "22", uk_sizes: [20] }] })
      .expect(200);
    const dress = (await search({ uk_size: 20, category: "clothes" })).find(
      (p) => p.title === "Wrap Midi Dress" && p.colour === "Black"
    );
    expect(dress).toMatchObject({ size_label: "22" });
  });
});

describe("POST /api/review/products/:product_id", () => {
  const weekender = async () =>
    (await db.query(`SELECT product_id FROM products WHERE title = 'The Weekender'`)).rows[0]
      .product_id;

  test("Tico sorts a Product: it is shown and leaves the Review list", async () => {
    await request(app)
      .post(`/api/review/products/${await weekender()}`)
      .set(ADMIN)
      .send({ audience: "women", category: "clothes" })
      .expect(200);
    expect((await search({ uk_size: 20, category: "clothes" })).map((p) => p.title)).toContain(
      "The Weekender"
    );
    expect((await reviewList()).products).toEqual([]);
  });

  test("Tico excludes a Product", async () => {
    await request(app)
      .post(`/api/review/products/${await weekender()}`)
      .set(ADMIN)
      .send({ excluded_as: "accessories" })
      .expect(200);
    expect((await reviewList()).products).toEqual([]);
    expect((await search({ uk_size: 20 })).map((p) => p.title)).not.toContain("The Weekender");
  });

  test("400: category must be a launch category", async () =>
    request(app)
      .post(`/api/review/products/${await weekender()}`)
      .set(ADMIN)
      .send({ audience: "women", category: "shoes" })
      .expect(400));
});

describe("GET /admin", () => {
  test("serves the Review list page", async () => {
    const { text } = await request(app).get("/admin").expect(200);
    expect(text).toMatch(/Review list/);
  });
});
