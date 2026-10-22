const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");

beforeEach(() => seed(data));
afterAll(() => db.end());

const productId = async (externalId) => {
  const { rows } = await db.query(`SELECT product_id FROM products WHERE external_id = $1`, [
    externalId,
  ]);
  return rows[0].product_id;
};

describe("GET /api/categories", () => {
  test("200: responds with the launch categories", async () => {
    const {
      body: { allCategories },
    } = await request(app).get("/api/categories").expect(200);
    expect(allCategories.map((c) => c.category_name).sort()).toEqual([
      "activewear",
      "clothes",
      "lingerie",
      "swimwear",
    ]);
  });
});

describe("GET /api/products/:product_id", () => {
  test("200: a Product with three Size labels is one Product with three sizes", async () => {
    const id = await productId("101:black");
    const {
      body: { product },
    } = await request(app).get(`/api/products/${id}`).expect(200);
    expect(product).toMatchObject({
      title: "Wrap Midi Dress",
      colour: "Black",
      retailer_name: "Northern Curve",
      price_in_pence: 3500,
    });
    expect(product.sizes.map((s) => s.size_label)).toEqual(["18", "20", "22"]);
  });

  test("200: one Size label can map to more than one UK size", async () => {
    const id = await productId("202:navy");
    const {
      body: { product },
    } = await request(app).get(`/api/products/${id}`).expect(200);
    expect(product.sizes[0]).toMatchObject({ size_label: "18/20", uk_sizes: [18, 20] });
  });

  test("404: no such Product", () => request(app).get("/api/products/99999").expect(404));

  test("400: id is not a number", () => request(app).get("/api/products/abc").expect(400));
});

describe("GET /api/retailers", () => {
  test("200: each Retailer records its source", async () => {
    const {
      body: { retailers },
    } = await request(app).get("/api/retailers").expect(200);
    expect(retailers.length).toBeGreaterThan(0);
    retailers.forEach((r) => expect(r.source).toBe("shopify"));
  });
});

describe("GET /api/products?uk_size=&category= (search)", () => {
  const search = async (query) => {
    const {
      body: { products },
    } = await request(app).get("/api/products").query(query).expect(200);
    return products;
  };

  test("R15: shows a Product only if it is in stock in the chosen UK size", async () => {
    const products = await search({ uk_size: 20, category: "clothes" });
    expect(products.map((p) => `${p.title} (${p.colour})`).sort()).toEqual([
      "Jersey Tee (White)",
      "Wrap Midi Dress (Red)",
    ]);
  });

  test("without a category, searches every launch category", async () => {
    const products = await search({ uk_size: 20 });
    expect(products.map((p) => p.title).sort()).toEqual([
      "High Waist Leggings",
      "Jersey Tee",
      "Tankini Set",
      "Wrap Midi Dress",
    ]);
  });

  test("R13: a Size label covering 18 and 20 appears in both searches, marked fits 18–20", async () => {
    for (const uk_size of [18, 20]) {
      const [tankini] = await search({ uk_size, category: "swimwear" });
      expect(tankini).toMatchObject({ title: "Tankini Set", size_label: "18/20", fits: "fits 18–20" });
    }
  });

  test("a Size label for one UK size has no fits range", async () => {
    const [dress] = await search({ uk_size: 22, category: "clothes" });
    expect(dress).toMatchObject({ title: "Wrap Midi Dress", size_label: "22", fits: null });
  });

  test("R14: each result shows when its stock was last checked", async () => {
    const [tee] = await search({ uk_size: 20, category: "clothes" });
    expect(new Date(tee.last_checked_at).toISOString()).toBe("2026-10-12T02:00:00.000Z");
  });

  test("results carry what a Product card needs", async () => {
    const [dress] = await search({ uk_size: 22, category: "clothes" });
    expect(dress).toMatchObject({
      retailer_name: "Northern Curve",
      price_in_pence: 3500,
      image_url: expect.any(String),
      product_id: expect.any(Number),
    });
  });

  test("R16: a Product sold out in every size is hidden but kept, and returns when a size is back", async () => {
    const id = await productId("104:white");
    expect((await search({ uk_size: 20 })).map((p) => p.product_id)).not.toContain(id);
    await request(app).get(`/api/products/${id}`).expect(200);

    await db.query(`UPDATE product_sizes SET in_stock = TRUE WHERE product_id = $1 AND size_label = '20'`, [id]);
    expect((await search({ uk_size: 20 })).map((p) => p.product_id)).toContain(id);
  });

  test("a Size label not yet translated is never matched", async () => {
    await db.query(`UPDATE product_sizes SET in_stock = FALSE WHERE size_label = '20'`);
    expect(await search({ uk_size: 20 })).toEqual([
      expect.objectContaining({ title: "Tankini Set" }),
    ]);
  });

  test("400: uk_size missing or not a UK size", async () => {
    await request(app).get("/api/products").expect(400);
    await request(app).get("/api/products?uk_size=big").expect(400);
  });

  test("400: a bra search with a band that is not a band size, or a cup with no band", async () => {
    await request(app).get("/api/products?bra_band=37").expect(400);
    await request(app).get("/api/products?bra_band=38&bra_cup=Z").expect(400);
    await request(app).get("/api/products?bra_cup=DD").expect(400);
    await request(app).get("/api/products?uk_size=20&bra_band=38").expect(400);
  });

  test("lingerie is a category she can search", () =>
    request(app).get("/api/products?uk_size=20&category=lingerie").expect(200));

  test("400: unknown category", () =>
    request(app).get("/api/products?uk_size=20&category=shoes").expect(400));
});
