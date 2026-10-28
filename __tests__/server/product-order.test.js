const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { rebuildProductOrder } = require("../../lib/product-order");
const { runStockCheck } = require("../../lib/stock-check");
const { migrate } = require("../../db/migrate");

beforeEach(() => seed(data));
afterAll(() => db.end());

const browse = async (query = {}) =>
  (await request(app).get("/api/products").query(query).expect(200)).body.products;

const currentRetailers = async () =>
  (await db.query(`SELECT retailer_id FROM retailers WHERE removed_at IS NULL ORDER BY retailer_id`)).rows.map(
    (r) => r.retailer_id
  );

const addProduct = async (retailerId, externalId, sortStatus = "shown") => {
  const {
    rows: [{ product_id }],
  } = await db.query(
    `INSERT INTO products (retailer_id, external_id, title, product_url, category, sort_status)
     VALUES ($1, $2, 'Dress', 'https://shop.example/dress', 'clothes', $3) RETURNING product_id`,
    [retailerId, externalId, sortStatus]
  );
  await db.query(
    `INSERT INTO product_sizes (product_id, size_label, uk_sizes, size_status, in_stock)
     VALUES ($1, '20', '{20}', 'translated', TRUE)`,
    [product_id]
  );
  return product_id;
};

// Six Products at each of the two current Retailers and nothing else.
const twoShopsOfSix = async () => {
  await db.query(`DELETE FROM products`);
  const shops = await currentRetailers();
  for (const retailerId of shops) {
    for (let n = 1; n <= 6; n++) await addProduct(retailerId, `order-${n}`);
  }
  return shops;
};

// Products a Shopper may see: shown, still at a current Retailer.
const shownCount = async () =>
  Number(
    (
      await db.query(
        `SELECT count(*) FROM products p JOIN retailers r USING (retailer_id)
         WHERE p.sort_status = 'shown' AND p.missing_since IS NULL AND r.removed_at IS NULL`
      )
    ).rows[0].count
  );
const orderCount = async () => Number((await db.query(`SELECT count(*) FROM product_order`)).rows[0].count);

describe("the saved product order (worked out once a night, not per visitor)", () => {
  test("browsing twice gives the same order, so the answer can be cached", async () => {
    await twoShopsOfSix();
    await rebuildProductOrder();
    const first = (await browse()).map((p) => p.product_id);
    const second = (await browse()).map((p) => p.product_id);
    expect(first).toHaveLength(12);
    expect(second).toEqual(first);
  });

  test("after a rebuild every shown Product has a place and Retailers still take turns", async () => {
    await twoShopsOfSix();
    await rebuildProductOrder();
    expect(await orderCount()).toBe(await shownCount());
    const names = (await browse()).map((p) => p.retailer_name);
    names.slice(1).forEach((name, i) => expect(name).not.toBe(names[i]));
  });

  test("a rebuild mixes each Retailer's Products afresh", async () => {
    await twoShopsOfSix();
    const orders = new Set();
    for (let i = 0; i < 8; i++) {
      await rebuildProductOrder();
      orders.add((await browse()).map((p) => p.product_id).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  test("a Product added during the day shows at once, after its Retailer's others", async () => {
    const [shop] = await twoShopsOfSix();
    await rebuildProductOrder();
    const added = await addProduct(shop, "added-later");
    const ids = (await browse()).map((p) => p.product_id);
    expect(ids).toContain(added);
    expect(ids.indexOf(added)).toBeGreaterThanOrEqual(10);
  });

  test("a Product the AI or Tico shows later appears without waiting for the night", async () => {
    const [shop] = await twoShopsOfSix();
    await rebuildProductOrder();
    const waiting = await addProduct(shop, "waiting", "unsettled");
    expect((await browse()).map((p) => p.product_id)).not.toContain(waiting);
    await db.query(`UPDATE products SET sort_status = 'shown' WHERE product_id = $1`, [waiting]);
    expect((await browse()).map((p) => p.product_id)).toContain(waiting);
  });

  test("the nightly Stock check rebuilds the order", async () => {
    await db.query(`DELETE FROM product_order`);
    await runStockCheck({ fetcher: { getJson: async () => ({ products: [] }) }, log: () => {}, only: ["1"] });
    expect(await orderCount()).toBe(await shownCount());
  });

  test("a deploy (migrate) fills the order", async () => {
    await db.query(`DELETE FROM product_order`);
    await migrate({ lockTimeoutMs: 1000, retryEveryMs: 10, giveUpAfterMs: 0 });
    expect(await orderCount()).toBe(await shownCount());
  });
});

describe("GET /api/products?retailer_id= (one shop's page)", () => {
  test("lists only that Retailer's Products", async () => {
    const [shop, other] = await twoShopsOfSix();
    const products = await browse({ retailer_id: shop });
    expect(products).toHaveLength(6);
    for (const p of products) expect(p.retailer_id).toBe(shop);
    expect((await browse({ retailer_id: other })).every((p) => p.retailer_id === other)).toBe(true);
  });

  test("works with a size too", async () => {
    const [shop] = await twoShopsOfSix();
    const products = await browse({ retailer_id: shop, uk_size: 20 });
    expect(products).toHaveLength(6);
  });

  test("400: retailer_id is not a number", () => request(app).get("/api/products?retailer_id=abc").expect(400));
});
