const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(async () => {
  await seed(data);
  // The seeded black Wrap Midi Dress: sizes 18, 20, 22 are variants 11, 12, 13.
  await db.query(
    `UPDATE product_sizes s SET variant_refs = ARRAY[v.ref]
     FROM (VALUES ('18', '11'), ('20', '12'), ('22', '13')) AS v(label, ref), products p
     WHERE s.product_id = p.product_id AND p.external_id = '101:black' AND s.size_label = v.label`
  );
});
afterAll(() => db.end());

// A Retailer's live product data (Shopify's /products/<handle>.js), as variant id → available.
const liveShop = (available, { fail = false, delayMs = 0 } = {}) => {
  const asked = [];
  return {
    asked,
    getJson: async (url) => {
      asked.push(url);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      if (fail) throw new Error("503");
      return {
        variants: Object.entries(available).map(([id, ok]) => ({ id: Number(id), available: ok })),
      };
    },
  };
};

const productId = async (externalId) =>
  (await db.query(`SELECT product_id FROM products WHERE external_id = $1`, [externalId])).rows[0]
    .product_id;

const clickOut = (product_id, uk_size) =>
  request(app).post("/api/click-outs").send({ product_id, uk_size });

const recorded = async () =>
  (await db.query(`SELECT product_id, uk_size, outcome, clicked_at FROM click_outs`)).rows;

describe("POST /api/click-outs", () => {
  test("R18: a Live check runs, then she is sent to the Retailer", async () => {
    const shop = liveShop({ 11: true, 12: false, 13: true });
    app.set("liveFetcher", shop);
    const id = await productId("101:black");
    const { body } = await clickOut(id, 18).expect(200);
    expect(shop.asked).toEqual(["https://northern-curve.example/products/wrap-midi-dress.js"]);
    expect(body).toEqual({
      outcome: "sent",
      url: "https://northern-curve.example/products/wrap-midi-dress?variant=1",
    });
  });

  test("R19: if her size just sold out she is not sent, it is marked sold out, and similar Products are offered", async () => {
    app.set("liveFetcher", liveShop({ 11: true, 12: false, 13: false }));
    const id = await productId("101:black");
    const { body } = await clickOut(id, 22).expect(200);
    expect(body.outcome).toBe("sold_out");
    expect(body.message).toBe("Just sold out in 22");
    expect(body.url).toBeUndefined();

    const { body: search } = await request(app).get("/api/products?uk_size=22&category=clothes");
    expect(search.products.map((p) => p.product_id)).not.toContain(id);
    expect(body.similar.map((p) => p.product_id)).not.toContain(id);
  });

  test("similar means same category, in stock in her UK size, closest price first", async () => {
    app.set("liveFetcher", liveShop({ 11: false, 12: false, 13: false }));
    // The black dress costs £35; both clothes in stock in 20: Red dress £35, Jersey Tee £15.
    await db.query(`UPDATE product_sizes s SET in_stock = TRUE FROM products p
      WHERE s.product_id = p.product_id AND p.external_id = '101:black' AND s.size_label = '20'`);
    const { body } = await clickOut(await productId("101:black"), 20).expect(200);
    expect(body.similar.map((p) => `${p.title} (${p.colour})`)).toEqual([
      "Wrap Midi Dress (Red)",
      "Jersey Tee (White)",
    ]);
    expect(body.similar[0]).toMatchObject({ size_label: "20", retailer_name: "Northern Curve" });
  });

  test("R20: if the Live check fails, she is sent on as normal", async () => {
    app.set("liveFetcher", liveShop({}, { fail: true }));
    const { body } = await clickOut(await productId("101:black"), 18).expect(200);
    expect(body.outcome).toBe("sent");
  });

  test("R20: if the Live check takes too long, she is sent on as normal", async () => {
    app.set("liveFetcher", liveShop({ 11: false }, { delayMs: 400 }));
    app.set("liveCheckTimeoutMs", 50);
    const { body } = await clickOut(await productId("101:black"), 18).expect(200);
    expect(body.outcome).toBe("sent");
    app.set("liveCheckTimeoutMs", undefined);
  });

  test("R21: every Click-out is recorded with the Product, UK size and time", async () => {
    app.set("liveFetcher", liveShop({ 11: true, 12: false, 13: false }));
    const id = await productId("101:black");
    await clickOut(id, 18).expect(200);
    await clickOut(id, 22).expect(200);
    app.set("liveFetcher", liveShop({}, { fail: true }));
    await clickOut(id, 18).expect(200);
    const rows = await recorded();
    expect(rows.map((r) => [r.product_id, r.uk_size, r.outcome])).toEqual([
      [id, 18, "sent"],
      [id, 22, "sold_out"],
      [id, 18, "check_failed"],
    ]);
    rows.forEach((r) => expect(r.clicked_at).toBeInstanceOf(Date));
  });

  test("404: a Product a Shopper cannot see", async () => {
    app.set("liveFetcher", liveShop({}));
    await clickOut(await productId("206:blue"), 20).expect(404);
    await clickOut(99999, 20).expect(404);
  });

  test("400: missing UK size", async () => {
    await request(app).post("/api/click-outs").send({ product_id: 1 }).expect(400);
  });
});
