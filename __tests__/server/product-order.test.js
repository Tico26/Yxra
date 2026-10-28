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

const shownCount = async () =>
  Number((await db.query(`SELECT count(*) FROM products WHERE sort_status = 'shown'`)).rows[0].count);
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

  test("a Stock check of one shop leaves the order to the night's last step, after every shop and the AI", async () => {
    await rebuildProductOrder();
    const before = (await db.query(`SELECT product_id, turn, shop_order FROM product_order ORDER BY product_id`)).rows;
    await runStockCheck({ fetcher: { getJson: async () => ({ products: [] }) }, log: () => {}, only: ["1"] });
    const after = (await db.query(`SELECT product_id, turn, shop_order FROM product_order ORDER BY product_id`)).rows;
    expect(after).toEqual(before);
  });

  test("a Product already in the order keeps its place when it is saved again", async () => {
    const [shop] = await twoShopsOfSix();
    await rebuildProductOrder();
    const place = async () =>
      (await db.query(`SELECT turn, shop_order FROM product_order o JOIN products p USING (product_id)
                       WHERE p.retailer_id = $1 AND p.external_id = 'order-1'`, [shop])).rows[0];
    const before = await place();
    await db.query(`UPDATE products SET sort_status = 'shown', title = 'Dress again' WHERE external_id = 'order-1'`);
    expect(await place()).toEqual(before);
  });

  test("a deploy (migrate) fills the order", async () => {
    await db.query(`DELETE FROM product_order`);
    await migrate({ lockTimeoutMs: 1000, retryEveryMs: 10, giveUpAfterMs: 0 });
    expect(await orderCount()).toBe(await shownCount());
  });
});

describe("professional photos first (Tico, 28 Oct 2026)", () => {
  const judge = (productIds, professional, imageUrl = null) =>
    db.query(
      `UPDATE products SET photo_professional = $2, photo_checked_url = COALESCE($3, image_url),
         image_url = COALESCE($3, image_url)
       WHERE product_id = ANY ($1::int[])`,
      [productIds, professional, imageUrl]
    );

  test("Products with a professional photo come before the rest, while Retailers still take turns", async () => {
    await twoShopsOfSix();
    const { rows } = await db.query(`SELECT product_id FROM products ORDER BY product_id`);
    const ids = rows.map((r) => r.product_id);
    const pro = [ids[1], ids[4], ids[7], ids[10]];
    await db.query(`UPDATE products SET image_url = 'https://img.example/' || product_id || '.jpg'`);
    await judge(pro, true);
    await judge(ids.filter((id) => !pro.includes(id)).slice(0, 3), false);
    await rebuildProductOrder();
    const products = await browse();
    expect(products.slice(0, 4).map((p) => p.product_id).sort((a, b) => a - b)).toEqual(pro);
    const firstNames = products.slice(0, 4).map((p) => p.retailer_name);
    firstNames.slice(1).forEach((name, i) => expect(name).not.toBe(firstNames[i]));
  });

  test("a photo judged professional no longer counts once the Product's photo changes", async () => {
    await twoShopsOfSix();
    const { rows } = await db.query(`SELECT product_id FROM products ORDER BY product_id DESC LIMIT 1`);
    const id = rows[0].product_id;
    await judge([id], true, "https://img.example/old.jpg");
    await db.query(`UPDATE products SET image_url = 'https://img.example/new.jpg' WHERE product_id = $1`, [id]);
    await rebuildProductOrder();
    const placed = await db.query(`SELECT photo_rank FROM product_order WHERE product_id = $1`, [id]);
    expect(placed.rows[0].photo_rank).toBe(1);
  });

  test("a Product shown during the day with a professional photo joins the professional ones", async () => {
    const [shop] = await twoShopsOfSix();
    const { rows } = await db.query(`SELECT product_id FROM products WHERE retailer_id = $1 LIMIT 1`, [shop]);
    await judge([rows[0].product_id], true, "https://img.example/pro.jpg");
    await rebuildProductOrder();
    const waiting = await addProduct(shop, "waiting-pro", "unsettled");
    await judge([waiting], true, "https://img.example/pro-2.jpg");
    await db.query(`UPDATE products SET sort_status = 'shown' WHERE product_id = $1`, [waiting]);
    const ids = (await browse()).map((p) => p.product_id);
    expect(ids.slice(0, 2)).toEqual([rows[0].product_id, waiting]);
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
