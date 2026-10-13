const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { runStockCheck } = require("../../lib/stock-check");
const page1 = require("../fixtures/shopify/products-page-1.json");
const page2 = require("../fixtures/shopify/products-page-2.json");

const NORTHERN = "https://northern-curve.example";
const SEASIDE = "https://seaside-plus.example";

// Saved Shopify responses per site; a site set to an Error fails to load.
const savedWeb = (sites) => {
  const asked = [];
  return {
    asked,
    getJson: async (url) => {
      const { origin, searchParams } = new URL(url);
      asked.push(origin);
      const site = sites[origin];
      if (site instanceof Error) throw site;
      return (site && site[searchParams.get("page")]) || { products: [] };
    },
  };
};

const NIGHT = (n) => new Date(Date.UTC(2026, 9, 13 + n, 2));
const quiet = { log: () => {} };

beforeEach(() => seed(data));
afterAll(() => db.end());

const productByExternal = async (externalId) =>
  (await db.query(`SELECT * FROM products WHERE external_id = $1`, [externalId])).rows[0];

const search = async (uk_size) =>
  (await request(app).get("/api/products").query({ uk_size }).expect(200)).body.products;

describe("nightly Stock check", () => {
  test("R1: only Retailers Tico added (and has not removed) are collected", async () => {
    const web = savedWeb({});
    await runStockCheck({ fetcher: web, now: NIGHT(0), ...quiet });
    expect([...new Set(web.asked)].sort()).toEqual([NORTHERN, SEASIDE]);
  });

  test("R14: every Product's stock per size is refreshed, with the check time stored", async () => {
    await runStockCheck({ fetcher: savedWeb({ [NORTHERN]: { 1: page1 } }), now: NIGHT(0), ...quiet });
    const black = await productByExternal("1001:black");
    expect(black.last_checked_at).toEqual(NIGHT(0));
    const [result] = (await search(22)).filter((p) => p.product_id === black.product_id);
    expect(new Date(result.last_checked_at)).toEqual(NIGHT(0));
  });

  test("R6: one Retailer failing does not stop the others, and its Products keep their last stock", async () => {
    const before = await productByExternal("101:black");
    const summary = await runStockCheck({
      fetcher: savedWeb({ [NORTHERN]: new Error("timed out"), [SEASIDE]: { 1: page2 } }),
      now: NIGHT(0),
      ...quiet,
    });
    expect(await productByExternal("1003:navy")).toBeDefined();
    const after = await productByExternal("101:black");
    expect(after.last_checked_at).toEqual(before.last_checked_at);
    expect(after.missing_since).toBeNull();
    expect((await search(22)).map((p) => p.product_id)).toContain(after.product_id);
    expect(summary.failed).toEqual([{ retailer: "Northern Curve", error: "timed out" }]);
  });

  test("R16: a Product gone from its Retailer's data is hidden, and back when it returns", async () => {
    const sites = { [NORTHERN]: { 1: page1 } };
    await runStockCheck({ fetcher: savedWeb(sites), now: NIGHT(0), ...quiet });
    const red = await productByExternal("1001:red");
    expect((await search(20)).map((p) => p.product_id)).toContain(red.product_id);

    const withoutDress = { products: page1.products.slice(1) };
    await runStockCheck({ fetcher: savedWeb({ [NORTHERN]: { 1: withoutDress } }), now: NIGHT(1), ...quiet });
    expect((await search(20)).map((p) => p.product_id)).not.toContain(red.product_id);

    await runStockCheck({ fetcher: savedWeb(sites), now: NIGHT(2), ...quiet });
    expect((await search(20)).map((p) => p.product_id)).toContain(red.product_id);
  });

  test("R17: a Product missing from its Retailer's data for 30 nights in a row is deleted", async () => {
    const web = savedWeb({ [NORTHERN]: { 1: page1 } });
    await runStockCheck({ fetcher: web, now: NIGHT(0), ...quiet });
    const empty = savedWeb({});

    await runStockCheck({ fetcher: empty, now: NIGHT(1), ...quiet });
    await runStockCheck({ fetcher: empty, now: NIGHT(30), ...quiet });
    expect(await productByExternal("1001:black")).toBeDefined();

    await runStockCheck({ fetcher: empty, now: NIGHT(31), ...quiet });
    expect(await productByExternal("1001:black")).toBeUndefined();
  });
});

describe("Retailers whose source is structured data", () => {
  const fs = require("fs");
  const path = require("path");
  const CURVE = "https://curve-house.example";
  const fixture = (name) =>
    fs.readFileSync(path.join(__dirname, "../fixtures/structured-data", name), "utf8");

  test("R2: are collected nightly from their own source, like a Shopify one", async () => {
    await db.query(
      `INSERT INTO retailers (retailer_name, site_url, source, women_only)
       VALUES ('Curve House', $1, 'structured_data', TRUE)`,
      [CURVE]
    );
    const pages = {
      [`${CURVE}/sitemap.xml`]: fixture("sitemap-products-1.xml"),
      [`${CURVE}/p/tea-dress`]: fixture("tea-dress.html"),
      [`${CURVE}/p/swim-dress`]: fixture("swim-dress.html"),
    };
    const shopifyAsked = [];
    const fetcher = {
      getJson: async (url) => {
        shopifyAsked.push(new URL(url).origin);
        return { products: [] };
      },
      getText: async (url) => {
        if (!(url in pages)) throw new Error("404");
        return pages[url];
      },
      sitemapsFor: async () => [],
    };
    await runStockCheck({ fetcher, now: NIGHT(0), ...quiet });

    expect(shopifyAsked).not.toContain(CURVE);
    const results = await search(20);
    expect(results.filter((p) => p.retailer_name === "Curve House").map((p) => p.colour)).toEqual([
      "Red",
    ]);
    expect((await search(22)).map((p) => p.title)).toContain("Tummy Control Swim Dress");
  });
});
