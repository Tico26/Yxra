process.env.ADMIN_TOKEN = "test-admin-token";
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(() => seed(data));
afterAll(() => db.end());

const ADMIN = { Authorization: "Bearer test-admin-token" };

const retailerId = async (site) =>
  (await db.query(`SELECT retailer_id FROM retailers WHERE site_url = $1`, [site])).rows[0]
    .retailer_id;

const searchTitles = async () =>
  (await request(app).get("/api/products?uk_size=20").expect(200)).body.products.map(
    (p) => p.retailer_name
  );

describe("POST /api/retailers", () => {
  test("201: Tico adds a Retailer with its name, site and source", async () => {
    const {
      body: { retailer },
    } = await request(app)
      .post("/api/retailers")
      .set(ADMIN)
      .send({ retailer_name: "New Plus", site_url: "https://www.new-plus.example/collections/all", source: "shopify", women_only: true })
      .expect(201);
    expect(retailer).toMatchObject({
      retailer_name: "New Plus",
      site_url: "https://www.new-plus.example",
      source: "shopify",
      women_only: true,
      removed_at: null,
    });
    const {
      body: { retailers },
    } = await request(app).get("/api/retailers").expect(200);
    expect(retailers.map((r) => r.retailer_name)).toContain("New Plus");
  });

  test("400: source must be one Amara's Pick can read", () =>
    request(app)
      .post("/api/retailers")
      .set(ADMIN)
      .send({ retailer_name: "X", site_url: "https://x.example", source: "magic" })
      .expect(400));

  test("400: site must be a web address", () =>
    request(app)
      .post("/api/retailers")
      .set(ADMIN)
      .send({ retailer_name: "X", site_url: "not a url", source: "shopify" })
      .expect(400));

  test("adding a removed Retailer again brings it back", async () => {
    const {
      body: { retailer },
    } = await request(app)
      .post("/api/retailers")
      .set(ADMIN)
      .send({ retailer_name: "Gone Retailer", site_url: "https://gone-retailer.example", source: "shopify", women_only: true })
      .expect(201);
    expect(retailer.removed_at).toBeNull();
    expect(await searchTitles()).toContain("Gone Retailer");
  });

  test("clearing women-only sends Products that were for women only by default back to Review", async () => {
    await request(app)
      .post("/api/retailers")
      .set(ADMIN)
      .send({ retailer_name: "Northern Curve", site_url: "https://northern-curve.example", source: "shopify", women_only: false })
      .expect(201);
    expect(await searchTitles()).not.toContain("Northern Curve");
    const { rows } = await db.query(
      `SELECT DISTINCT audience, sort_status, ai_asked_hash FROM products WHERE retailer_id = $1`,
      [await retailerId("https://northern-curve.example")]
    );
    expect(rows).toEqual([{ audience: null, sort_status: "unsettled", ai_asked_hash: null }]);
  });

  test("401: only Tico can add Retailers", () =>
    request(app)
      .post("/api/retailers")
      .send({ retailer_name: "X", site_url: "https://x.example", source: "shopify" })
      .expect(401));
});

describe("DELETE /api/retailers/:retailer_id", () => {
  test("R5: its Products disappear from search at once", async () => {
    expect(await searchTitles()).toContain("Northern Curve");
    await request(app)
      .delete(`/api/retailers/${await retailerId("https://northern-curve.example")}`)
      .set(ADMIN)
      .expect(204);
    expect(await searchTitles()).not.toContain("Northern Curve");
    const {
      body: { retailers },
    } = await request(app).get("/api/retailers").expect(200);
    expect(retailers.map((r) => r.retailer_name)).not.toContain("Northern Curve");
  });

  test("404: no such Retailer", () =>
    request(app).delete("/api/retailers/9999").set(ADMIN).expect(404));

  test("401: only Tico can remove Retailers", async () =>
    request(app)
      .delete(`/api/retailers/${await retailerId("https://northern-curve.example")}`)
      .expect(401));
});
