const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { collectRetailer } = require("../../lib/collect");
const { reopenExcludedLingerie } = require("../../lib/catalogue");
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

  describe("lingerie and Bra sizes", () => {
    const bra = (id, title, sizes) => ({
      id,
      title,
      handle: title.toLowerCase().replace(/ /g, "-"),
      vendor: "Fixture Lingerie",
      product_type: "Bras",
      options: [
        { name: "Band Size", position: 1 },
        { name: "Cup Size", position: 2 },
      ],
      variants: sizes.map(([band, cup, available], i) => ({
        id: id * 10 + i,
        option1: band,
        option2: cup,
        available,
        price: "30.00",
      })),
      images: [],
    });
    const briefs = {
      id: 70,
      title: "High Waist Briefs",
      handle: "high-waist-briefs",
      vendor: "Fixture Lingerie",
      product_type: "Knickers",
      options: [{ name: "Size", position: 1 }],
      variants: [
        { id: 701, option1: "20", available: true, price: "12.00" },
        { id: 702, option1: "22", available: false, price: "12.00" },
      ],
      images: [],
    };
    const lingeriePage = {
      products: [
        bra(60, "Lace Balcony Bra", [["36", "DD", true], ["38", "DD", true], ["40", "E", false]]),
        bra(61, "Petite Plunge Bra", [["32", "B", true], ["34", "C", true]]),
        briefs,
      ],
    };
    const titles = (products) =>
      products.filter((p) => p.retailer_name === "Fixture Shop").map((p) => p.title);

    beforeEach(() => collectRetailer(retailer, { fetcher: savedShopify({ 1: lingeriePage }) }));

    test("a bra made in band 38 or above is shown and found by band", async () => {
      expect(titles(await search({ bra_band: 38, category: "lingerie" }))).toEqual([
        "Lace Balcony Bra",
      ]);
      const [found] = await search({ bra_band: 38, bra_cup: "dd" });
      expect(found).toMatchObject({ title: "Lace Balcony Bra", size_label: "38DD", fits: null });
      await request(app)
        .post("/api/click-outs")
        .send({ product_id: found.product_id, bra_band: 37 })
        .expect(400);
    });

    test("a Plus-size bra is found in its smaller bands too", async () => {
      expect(titles(await search({ bra_band: 36 }))).toEqual(["Lace Balcony Bra"]);
    });

    test("a bra made only below band 38 is excluded", async () => {
      const petite = (await fixtureProducts()).find((p) => p.title === "Petite Plunge Bra");
      expect(petite).toMatchObject({ category: "lingerie", sort_status: "excluded" });
      expect(titles(await search({ bra_band: 34 }))).toEqual([]);
    });

    test("a sold-out Bra size is stored but not found", async () => {
      expect(titles(await search({ bra_band: 40 }))).toEqual([]);
      expect(titles(await search({ bra_band: 40, bra_cup: "E" }))).toEqual([]);
      const lace = (await fixtureProducts()).find((p) => p.title === "Lace Balcony Bra");
      const {
        body: { product },
      } = await request(app).get(`/api/products/${lace.product_id}`).expect(200);
      expect(product.sizes.find((s) => s.size_label === "40E")).toMatchObject({
        bra_band: 40,
        bra_cup: "E",
        in_stock: false,
      });
    });

    test("lingerie in UK sizes is found by UK size, like clothes", async () => {
      expect(titles(await search({ uk_size: 20, category: "lingerie" }))).toEqual([
        "High Waist Briefs",
      ]);
      expect(titles(await search({ uk_size: 22, category: "lingerie" }))).toEqual([]);
    });

    test("lingerie excluded before ADR 0007 is sorted again and shown", async () => {
      const lace = (await fixtureProducts()).find((p) => p.title === "Lace Balcony Bra");
      await db.query(
        `UPDATE products SET category = NULL, excluded_as = 'lingerie', sort_status = 'excluded'
         WHERE product_id = $1`,
        [lace.product_id]
      );
      expect(await reopenExcludedLingerie()).toBe(1);
      const [after] = (
        await db.query(`SELECT category, excluded_as, sort_status FROM products WHERE product_id = $1`, [
          lace.product_id,
        ])
      ).rows;
      expect(after).toEqual({ category: "lingerie", excluded_as: null, sort_status: "shown" });
      expect(await reopenExcludedLingerie()).toBe(0);
    });

    test("a Click-out for a bra sends her to her band and cup, and records it", async () => {
      const lace = (await fixtureProducts()).find((p) => p.title === "Lace Balcony Bra");
      const { body } = await request(app)
        .post("/api/click-outs")
        .send({ product_id: lace.product_id, uk_size: null, bra_band: 38, bra_cup: "DD" })
        .expect(200);
      expect(new URL(body.url).searchParams.get("variant")).toBe("601");
      const { rows } = await db.query(`SELECT uk_size, bra_band, bra_cup FROM click_outs`);
      expect(rows).toEqual([{ uk_size: null, bra_band: 38, bra_cup: "DD" }]);
    });
  });

  test("a removed Retailer is not collected", async () => {
    const [gone] = (await db.query(`SELECT * FROM retailers WHERE removed_at IS NOT NULL`)).rows;
    await expect(collectRetailer(gone, { fetcher: savedShopify({ 1: page1 }) })).rejects.toThrow(
      /removed/
    );
  });
});
