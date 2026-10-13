const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { collectRetailer } = require("../../lib/collect");
const page1 = require("../fixtures/shopify/products-page-1.json");
const page2 = require("../fixtures/shopify/products-page-2.json");

const SITE = "https://fixture-shop.example";

// Serves saved Shopify responses instead of the live site.
const savedShopify = (pages) => ({
  getJson: async (url) => pages[new URL(url).searchParams.get("page")] || { products: [] },
});

let retailer;
beforeEach(async () => {
  await seed(data);
  const { rows } = await db.query(
    `INSERT INTO retailers (retailer_name, site_url, source, women_only)
     VALUES ('Fixture Shop', $1, 'shopify', TRUE) RETURNING *`,
    [SITE]
  );
  retailer = rows[0];
});
afterAll(() => db.end());

const search = async (query) =>
  (await request(app).get("/api/products").query(query).expect(200)).body.products;

const fixtureProducts = async () =>
  (
    await db.query(
      `SELECT * FROM products WHERE retailer_id = $1 ORDER BY external_id`,
      [retailer.retailer_id]
    )
  ).rows;

describe("collecting a Shopify Retailer", () => {
  test("loads one Product per colour, with sizes and stock, ready to search", async () => {
    await collectRetailer(retailer, { fetcher: savedShopify({ 1: page1, 2: page2 }) });

    const in20 = await search({ uk_size: 20, category: "clothes" });
    expect(in20.filter((p) => p.retailer_name === "Fixture Shop").map((p) => p.colour)).toEqual([
      "Red",
    ]);
    const in22 = (await search({ uk_size: 22, category: "clothes" })).find(
      (p) => p.retailer_name === "Fixture Shop"
    );
    expect(in22).toMatchObject({ colour: "Black", size_label: "22/24", fits: "fits 22–24" });
  });

  test("labels it cannot translate are stored but not shown", async () => {
    await collectRetailer(retailer, { fetcher: savedShopify({ 1: page1 }) });
    const vest = (await fixtureProducts()).find((p) => p.title === "Ribbed Vest Top");
    const {
      body: { product },
    } = await request(app).get(`/api/products/${vest.product_id}`).expect(200);
    expect(product.sizes.map((s) => [s.size_label, s.size_status])).toEqual([
      ["3X", "unsettled"],
      ["4X", "unsettled"],
    ]);
    expect(product.sort_status).toBe("unsettled");
  });

  test("re-running updates existing Products instead of duplicating them", async () => {
    await collectRetailer(retailer, { fetcher: savedShopify({ 1: page1, 2: page2 }) });
    const first = await fixtureProducts();

    const restocked = JSON.parse(JSON.stringify(page1));
    restocked.products[0].variants.find((v) => v.id === 13).available = true;
    await collectRetailer(retailer, { fetcher: savedShopify({ 1: restocked, 2: page2 }) });

    const second = await fixtureProducts();
    expect(second.map((p) => p.product_id)).toEqual(first.map((p) => p.product_id));
    const blackIn20 = (await search({ uk_size: 20, category: "clothes" })).filter(
      (p) => p.retailer_name === "Fixture Shop"
    );
    expect(blackIn20.map((p) => p.colour).sort()).toEqual(["Black", "Red"]);
  });

  test("a removed Retailer is not collected", async () => {
    const [gone] = (await db.query(`SELECT * FROM retailers WHERE removed_at IS NOT NULL`)).rows;
    await expect(collectRetailer(gone, { fetcher: savedShopify({ 1: page1 }) })).rejects.toThrow(
      /removed/
    );
  });
});
