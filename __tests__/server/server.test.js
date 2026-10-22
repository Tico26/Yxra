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

  test("400: uk_size is not a UK size", async () => {
    await request(app).get("/api/products?uk_size=big").expect(400);
    await request(app).get("/api/products?uk_size=19").expect(400);
  });

  test("each result lists the Product's in-stock plus Size labels", async () => {
    const [dress] = await search({ uk_size: 22, category: "clothes" });
    expect(dress).toMatchObject({ title: "Wrap Midi Dress", in_stock_sizes: ["18", "22"] });
  });

  test("400: unknown category", () =>
    request(app).get("/api/products?uk_size=20&category=shoes").expect(400));

  test("Retailers take turns, so one Retailer's Products are not all together", async () => {
    await db.query(`DELETE FROM products`);
    const { rows: shops } = await db.query(`SELECT retailer_id FROM retailers LIMIT 2`);
    for (const { retailer_id } of shops) {
      for (let n = 1; n <= 3; n++) {
        const {
          rows: [{ product_id }],
        } = await db.query(
          `INSERT INTO products (retailer_id, external_id, title, product_url, category, sort_status)
           VALUES ($1, $2, 'Dress', 'https://shop.example/dress', 'clothes', 'shown')
           RETURNING product_id`,
          [retailer_id, `turns-${n}`]
        );
        await db.query(
          `INSERT INTO product_sizes (product_id, size_label, uk_sizes, size_status, in_stock)
           VALUES ($1, '20', '{20}', 'translated', TRUE)`,
          [product_id]
        );
      }
    }
    const {
      body: { products },
    } = await request(app).get("/api/products?uk_size=20").expect(200);
    const names = products.map((p) => p.retailer_name);
    expect(names).toHaveLength(6);
    names.slice(1).forEach((name, i) => expect(name).not.toBe(names[i]));
  });
});

describe("GET /api/products with no size (browse before she picks a size)", () => {
  const browse = async (query = {}) => {
    const {
      body: { products },
    } = await request(app).get("/api/products").query(query).expect(200);
    return products;
  };

  const addProduct = async (title, category, sizes) => {
    const {
      rows: [{ retailer_id }],
    } = await db.query(`SELECT retailer_id FROM retailers WHERE removed_at IS NULL LIMIT 1`);
    const {
      rows: [{ product_id }],
    } = await db.query(
      `INSERT INTO products (retailer_id, external_id, title, product_url, category, sort_status)
       VALUES ($1, $2, $2, 'https://shop.example/p', $3, 'shown') RETURNING product_id`,
      [retailer_id, title, category]
    );
    for (const s of sizes) {
      await db.query(
        `INSERT INTO product_sizes (product_id, size_label, uk_sizes, size_status, in_stock)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, s.size_label, s.uk_sizes || [], s.size_status || "translated", s.in_stock]
      );
    }
    return product_id;
  };

  test("200: shoppable Products in stock in at least one plus size, from every launch category", async () => {
    const products = await browse();
    expect(products.map((p) => `${p.title} (${p.colour})`).sort()).toEqual([
      "High Waist Leggings (Black)",
      "Jersey Tee (White)",
      "Tankini Set (Navy)",
      "Wrap Midi Dress (Black)",
      "Wrap Midi Dress (Red)",
    ]);
    const tankini = products.find((p) => p.title === "Tankini Set");
    expect(tankini).toMatchObject({ size_label: null, fits: null, in_stock_sizes: ["18/20"] });
  });

  test("a Product in stock only below plus size is left out; a Size label reaching 18 counts", async () => {
    await addProduct("Only 16 In Stock", "clothes", [
      { size_label: "16", uk_sizes: [16], in_stock: true },
      { size_label: "18", uk_sizes: [18], in_stock: false },
    ]);
    await addProduct("Covers 16 To 18", "clothes", [
      { size_label: "16/18", uk_sizes: [16, 18], in_stock: true },
    ]);
    const titles = (await browse()).map((p) => p.title);
    expect(titles).not.toContain("Only 16 In Stock");
    expect(titles).toContain("Covers 16 To 18");
  });

  test("a Size label not yet translated never counts", async () => {
    await addProduct("Only 3X", "clothes", [
      { size_label: "3X", size_status: "unsettled", in_stock: true },
    ]);
    expect((await browse()).map((p) => p.title)).not.toContain("Only 3X");
  });

  test("in_stock_sizes: in-stock translated plus Size labels, UK sizes ascending", async () => {
    const id = await addProduct("Many Sizes", "clothes", [
      { size_label: "26", uk_sizes: [26], in_stock: true },
      { size_label: "22", uk_sizes: [22], in_stock: true },
      { size_label: "16", uk_sizes: [16], in_stock: true },
      { size_label: "20", uk_sizes: [20], in_stock: false },
      { size_label: "18/20", uk_sizes: [18, 20], in_stock: true },
      { size_label: "4X", size_status: "unsettled", in_stock: true },
    ]);
    const expected = ["18/20", "22", "26"];
    const browsed = (await browse()).find((p) => p.product_id === id);
    expect(browsed.in_stock_sizes).toEqual(expected);
    const searched = (await browse({ uk_size: 22 })).find((p) => p.product_id === id);
    expect(searched.in_stock_sizes).toEqual(expected);
  });

  test("400: unknown category", () => request(app).get("/api/products?category=shoes").expect(400));
});
