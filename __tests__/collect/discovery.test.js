process.env.ADMIN_TOKEN = "test-admin-token";
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { runDiscovery } = require("../../lib/discovery");
const page1 = require("../fixtures/shopify/products-page-1.json");

const ADMIN = { Authorization: "Bearer test-admin-token" };

// Found shops, and what their sites look like to Yxra's reader.
const finder = (shops) => ({ find: async () => shops });
const web = (shopifySites) => ({
  getJson: async (url) => {
    if (shopifySites.includes(new URL(url).origin)) return page1;
    throw new Error("404");
  },
  getText: async () => {
    throw new Error("404");
  },
  sitemapsFor: async () => [],
});

const quiet = { log: () => {} };

beforeEach(() => seed(data));
afterAll(() => db.end());

const reviewList = async () => (await request(app).get("/api/review").set(ADMIN).expect(200)).body;
const retailerNames = async () =>
  (await request(app).get("/api/retailers").expect(200)).body.retailers.map((r) => r.retailer_name);

describe("discovery", () => {
  const BIGGER = { retailer_name: "Bigger Better", site_url: "https://www.bigger-better.example/shop", found_via: "web search" };

  test("R22: only creates Suggested Retailers, which wait on the Review list", async () => {
    await runDiscovery({ finder: finder([BIGGER]), fetcher: web(["https://www.bigger-better.example"]), ...quiet });
    expect(await retailerNames()).not.toContain("Bigger Better");
    expect((await reviewList()).suggested_retailers).toEqual([
      expect.objectContaining({
        retailer_name: "Bigger Better",
        site_url: "https://www.bigger-better.example",
        source: "shopify",
        status: "pending",
      }),
    ]);
  });

  test("skips shops Yxra cannot read", async () => {
    await runDiscovery({ finder: finder([BIGGER]), fetcher: web([]), ...quiet });
    expect((await reviewList()).suggested_retailers).toEqual([]);
  });

  test("never suggests a shop that is already a Retailer, even a removed one", async () => {
    const known = [
      { retailer_name: "NC", site_url: "https://northern-curve.example" },
      { retailer_name: "Gone", site_url: "https://gone-retailer.example" },
    ];
    await runDiscovery({
      finder: finder(known),
      fetcher: web(known.map((k) => k.site_url)),
      ...quiet,
    });
    expect((await reviewList()).suggested_retailers).toEqual([]);
  });

  test("Tico approves one: it becomes a Retailer and is collected", async () => {
    await runDiscovery({ finder: finder([BIGGER]), fetcher: web(["https://www.bigger-better.example"]), ...quiet });
    const [suggested] = (await reviewList()).suggested_retailers;
    const {
      body: { retailer },
    } = await request(app)
      .post(`/api/suggested-retailers/${suggested.suggested_retailer_id}/approve`)
      .set(ADMIN)
      .send({ women_only: true })
      .expect(201);
    expect(retailer).toMatchObject({ retailer_name: "Bigger Better", source: "shopify", women_only: true });
    expect(await retailerNames()).toContain("Bigger Better");
    expect((await reviewList()).suggested_retailers).toEqual([]);
  });

  test("R23: a shop Tico rejected is never suggested again", async () => {
    const sites = ["https://www.bigger-better.example"];
    await runDiscovery({ finder: finder([BIGGER]), fetcher: web(sites), ...quiet });
    const [suggested] = (await reviewList()).suggested_retailers;
    await request(app)
      .post(`/api/suggested-retailers/${suggested.suggested_retailer_id}/reject`)
      .set(ADMIN)
      .expect(200);
    expect((await reviewList()).suggested_retailers).toEqual([]);

    await runDiscovery({
      finder: finder([{ ...BIGGER, site_url: "https://www.bigger-better.example/" }]),
      fetcher: web(sites),
      ...quiet,
    });
    expect((await reviewList()).suggested_retailers).toEqual([]);
    expect(await retailerNames()).not.toContain("Bigger Better");
  });

  test("401: only Tico decides", () =>
    request(app).post("/api/suggested-retailers/1/approve").expect(401));

  test("404: no such Suggested Retailer", () =>
    request(app).post("/api/suggested-retailers/999/reject").set(ADMIN).expect(404));
});
