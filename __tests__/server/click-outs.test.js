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

const productId = async (externalId) =>
  (await db.query(`SELECT product_id FROM products WHERE external_id = $1`, [externalId])).rows[0]
    .product_id;

const clickOut = (product_id, uk_size) =>
  request(app).post("/api/click-outs").send({ product_id, uk_size });

const recorded = async () =>
  (await db.query(`SELECT product_id, uk_size, outcome, clicked_at FROM click_outs`)).rows;

describe("POST /api/click-outs", () => {
  test("ADR 0006: she is sent straight to the Retailer with her size chosen, no Live check", async () => {
    const id = await productId("101:black");
    const { body } = await clickOut(id, 18).expect(200);
    expect(body).toEqual({
      outcome: "sent",
      url: "https://northern-curve.example/products/wrap-midi-dress?variant=11",
    });
  });

  test("the link picks a variant of her size that was in stock at the Stock check", async () => {
    const { body } = await clickOut(await productId("101:black"), 22).expect(200);
    expect(body.url).toBe("https://northern-curve.example/products/wrap-midi-dress?variant=13");
  });

  test("R21: every Click-out is recorded with the Product, UK size and time", async () => {
    const id = await productId("101:black");
    await clickOut(id, 18).expect(200);
    await clickOut(id, 22).expect(200);
    const rows = await recorded();
    expect(rows.map((r) => [r.product_id, r.uk_size, r.outcome])).toEqual([
      [id, 18, "sent"],
      [id, 22, "sent"],
    ]);
    rows.forEach((r) => expect(r.clicked_at).toBeInstanceOf(Date));
  });

  test("404: a Product a Shopper cannot see", async () => {
    await clickOut(await productId("206:blue"), 20).expect(404);
    await clickOut(99999, 20).expect(404);
  });

  test("400: missing UK size", async () => {
    await request(app).post("/api/click-outs").send({ product_id: 1 }).expect(400);
  });
});
