const { Client } = require("pg");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { saveRetailerProducts } = require("../../lib/catalogue");
const { fetchProductById, searchProducts } = require("../../models/products.models");
const { settleProduct } = require("../../models/review.models");

let retailer;
beforeEach(async () => {
  await seed(data);
  const { rows } = await db.query(
    `INSERT INTO retailers (retailer_name, site_url, source, women_only)
     VALUES ('Save Shop', 'https://save-shop.example', 'shopify', TRUE) RETURNING *`
  );
  retailer = rows[0];
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => db.end());

// What a reader hands over for one Product (one colour of a Shopify product).
const found = (n, overrides = {}) => ({
  external_id: `${n}:black`,
  title: `Wrap Dress ${n}`,
  description: "A wrap dress",
  brand: "Save Shop",
  colour: "Black",
  product_url: `https://save-shop.example/products/wrap-${n}`,
  image_url: `https://cdn.shopify.com/s/files/wrap-${n}.jpg`,
  price_in_pence: 4500,
  product_type: "Dresses",
  tags: [],
  sizes: [
    { size_label: "16", in_stock: true, variant_refs: [`${n}1`] },
    { size_label: "18", in_stock: true, variant_refs: [`${n}2`] },
    { size_label: "20", in_stock: false, variant_refs: [`${n}3`] },
  ],
  ...overrides,
});

const product = async (externalId) =>
  (
    await db.query(`SELECT * FROM products WHERE retailer_id = $1 AND external_id = $2`, [
      retailer.retailer_id,
      externalId,
    ])
  ).rows[0];

const sizesOf = async (externalId) =>
  (
    await db.query(
      `SELECT s.size_label, s.in_stock, s.uk_sizes, s.size_status, s.variant_refs
       FROM product_sizes s JOIN products p USING (product_id)
       WHERE p.retailer_id = $1 AND p.external_id = $2 ORDER BY s.size_label`,
      [retailer.retailer_id, externalId]
    )
  ).rows;

describe("saving a Retailer's products", () => {
  test("takes a fixed number of database round trips, not several per product", async () => {
    const many = Array.from({ length: 300 }, (_, i) => found(i + 1));
    const query = jest.spyOn(Client.prototype, "query");
    await saveRetailerProducts(retailer, many);
    expect(query.mock.calls.length).toBeLessThan(40);

    query.mockClear();
    await saveRetailerProducts(retailer, many);
    expect(query.mock.calls.length).toBeLessThan(40);
    const { rows } = await db.query(`SELECT COUNT(*)::int AS n FROM products WHERE retailer_id = $1`, [
      retailer.retailer_id,
    ]);
    expect(rows[0].n).toBe(300);
  });

  test("stores sizes, stock and UK sizes, and shows a Plus-size dress", async () => {
    await saveRetailerProducts(retailer, [found(1)]);
    expect(await product("1:black")).toMatchObject({
      audience: "women",
      category: "clothes",
      sort_status: "shown",
      missing_since: null,
    });
    expect(await sizesOf("1:black")).toEqual([
      { size_label: "16", in_stock: true, uk_sizes: [16], size_status: "translated", variant_refs: ["11"] },
      { size_label: "18", in_stock: true, uk_sizes: [18], size_status: "translated", variant_refs: ["12"] },
      { size_label: "20", in_stock: false, uk_sizes: [20], size_status: "translated", variant_refs: ["13"] },
    ]);
  });

  test("a dress made only below UK 18 is excluded", async () => {
    await saveRetailerProducts(retailer, [
      found(1, { sizes: [{ size_label: "12", in_stock: true }, { size_label: "14", in_stock: true }] }),
    ]);
    expect((await product("1:black")).sort_status).toBe("excluded");
  });

  test("a later save updates stock, removes sizes no longer sold and keeps the product's id", async () => {
    await saveRetailerProducts(retailer, [found(1)]);
    const { product_id } = await product("1:black");

    await saveRetailerProducts(retailer, [
      found(1, {
        price_in_pence: 3900,
        sizes: [
          { size_label: "18", in_stock: false, variant_refs: ["12"] },
          { size_label: "20", in_stock: true, variant_refs: ["13"] },
        ],
      }),
    ]);
    expect(await product("1:black")).toMatchObject({ product_id, price_in_pence: 3900 });
    expect((await sizesOf("1:black")).map((s) => [s.size_label, s.in_stock])).toEqual([
      ["18", false],
      ["20", true],
    ]);
  });

  test("the same Size label listed twice is saved once, as last listed", async () => {
    await saveRetailerProducts(retailer, [
      found(1, {
        sizes: [
          { size_label: "18", in_stock: false, variant_refs: ["a"] },
          { size_label: "18", in_stock: true, variant_refs: ["b"] },
        ],
      }),
    ]);
    expect((await sizesOf("1:black")).map((s) => [s.size_label, s.in_stock, s.variant_refs])).toEqual([
      ["18", true, ["b"]],
    ]);
  });

  test("Tico's sorting is kept when only stock or price changes, and redone when the text changes", async () => {
    await saveRetailerProducts(retailer, [found(1, { product_type: "", title: "Ruby" })]);
    expect((await product("1:black")).sort_status).toBe("unsettled");
    await db.query(
      `UPDATE products SET category = 'clothes', sort_status = 'shown', sort_reason = NULL
       WHERE external_id = '1:black'`
    );

    await saveRetailerProducts(retailer, [found(1, { product_type: "", title: "Ruby", price_in_pence: 3000 })]);
    expect(await product("1:black")).toMatchObject({ category: "clothes", sort_status: "shown" });

    await saveRetailerProducts(retailer, [found(1, { product_type: "", title: "Ruby Midi" })]);
    expect(await product("1:black")).toMatchObject({ category: null, sort_status: "unsettled" });
  });

  describe("Clothes types (spec 0005)", () => {
    test("a new Clothes Product is saved with its Clothes type", async () => {
      await saveRetailerProducts(retailer, [found(1), found(2, { title: "Swim Dress 2", product_type: "" })]);
      expect((await product("1:black")).clothes_type).toBe("dresses");
      expect(await product("2:black")).toMatchObject({ category: "swimwear", clothes_type: null });
    });

    test("rule 6: the type is kept when only price changes, and decided again when the wording changes", async () => {
      await saveRetailerProducts(retailer, [found(1)]);
      await db.query(`UPDATE products SET clothes_type = 'tops' WHERE external_id = '1:black'`);

      await saveRetailerProducts(retailer, [found(1, { price_in_pence: 3000 })]);
      expect((await product("1:black")).clothes_type).toBe("tops");

      await saveRetailerProducts(retailer, [found(1, { title: "Wrap Skirt 1", product_type: "" })]);
      expect((await product("1:black")).clothes_type).toBe("skirts");
    });

    test("when Tico settles a Product as Clothes, the rules give its type; as anything else, none", async () => {
      await saveRetailerProducts(retailer, [found(1, { title: "Ruby Shirt Dress", product_type: "", tags: ["Sale"] })]);
      await db.query(`UPDATE products SET category = NULL, clothes_type = NULL WHERE external_id = '1:black'`);
      const { product_id } = await product("1:black");

      await settleProduct(product_id, { audience: "women", category: "clothes" });
      expect((await product("1:black")).clothes_type).toBe("dresses");

      await settleProduct(product_id, { audience: "women", category: "swimwear" });
      expect((await product("1:black")).clothes_type).toBe(null);
    });
  });

  test("products the shop stops listing are hidden, and come back when listed again", async () => {
    await saveRetailerProducts(retailer, [found(1), found(2)]);
    await saveRetailerProducts(retailer, [found(1)]);
    expect((await product("2:black")).missing_since).not.toBeNull();
    expect((await product("1:black")).missing_since).toBeNull();

    await saveRetailerProducts(retailer, [found(1), found(2)]);
    expect((await product("2:black")).missing_since).toBeNull();
  });

  test("records when the Retailer was collected", async () => {
    const now = new Date("2026-10-24T12:00:00Z");
    await saveRetailerProducts(retailer, [found(1)], now);
    const { rows } = await db.query(`SELECT last_collected_at FROM retailers WHERE retailer_id = $1`, [
      retailer.retailer_id,
    ]);
    expect(rows[0].last_collected_at).toEqual(now);
  });

  // xmin is the transaction that last wrote a row: unchanged means not rewritten.
  const rowVersions = async () =>
    (
      await db.query(
        `SELECT p.external_id, p.xmin::text AS product, s.size_label, s.xmin::text AS size
         FROM products p JOIN product_sizes s USING (product_id)
         WHERE p.retailer_id = $1 ORDER BY p.external_id, s.size_label`,
        [retailer.retailer_id]
      )
    ).rows;

  test("ADR 0008: an unchanged re-save rewrites no product or size rows", async () => {
    await saveRetailerProducts(retailer, [found(1), found(2)], new Date("2026-10-23T02:00:00Z"));
    const before = await rowVersions();
    await saveRetailerProducts(retailer, [found(1), found(2)], new Date("2026-10-24T02:00:00Z"));
    expect(await rowVersions()).toEqual(before);
  });

  test("ADR 0008: a changed price, stock flag or size is still saved, and only that row is rewritten", async () => {
    await saveRetailerProducts(retailer, [found(1), found(2), found(3)]);
    const before = await rowVersions();
    const sizes = found(2).sizes.map((s) => (s.size_label === "20" ? { ...s, in_stock: true } : s));
    await saveRetailerProducts(retailer, [
      found(1, { price_in_pence: 3900 }),
      found(2, { sizes }),
      found(3, { sizes: [...found(3).sizes, { size_label: "22", in_stock: true, variant_refs: ["34"] }] }),
    ]);
    expect((await product("1:black")).price_in_pence).toBe(3900);
    expect((await sizesOf("2:black")).find((s) => s.size_label === "20").in_stock).toBe(true);
    expect((await sizesOf("3:black")).map((s) => s.size_label)).toEqual(["16", "18", "20", "22"]);

    const after = await rowVersions();
    const changed = (key) =>
      after
        .filter((row) => before.some((b) => b.external_id === row.external_id && b.size_label === row.size_label && b[key] !== row[key]))
        .map((row) => (key === "product" ? row.external_id : `${row.external_id} ${row.size_label}`));
    // A new Size label changes the text hash the rules and AI go by, so 3:black is rewritten too.
    expect([...new Set(changed("product"))]).toEqual(["1:black", "3:black"]);
    expect(changed("size")).toEqual(["2:black 20"]);
  });

  test("ADR 0008: a Product and its sizes show when the Retailer was last collected", async () => {
    await saveRetailerProducts(retailer, [found(1)], new Date("2026-10-23T02:00:00Z"));
    const night = new Date("2026-10-24T02:00:00Z");
    await saveRetailerProducts(retailer, [found(1)], night);
    const { product_id } = await product("1:black");
    const shown = await fetchProductById(product_id);
    expect(shown.last_checked_at).toEqual(night);
    expect(shown.sizes.map((s) => new Date(s.last_checked_at))).toEqual([night, night, night]);
    const [result] = (await searchProducts({ ukSize: 18 })).filter((p) => p.product_id === product_id);
    expect(result.last_checked_at).toEqual(night);
  });
});
