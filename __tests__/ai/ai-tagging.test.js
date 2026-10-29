const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { runAiTagging } = require("../../lib/ai-tagging");
const { fetchReviewList } = require("../../models/review.models");
const { searchProducts } = require("../../models/products.models");
const { saveRetailerProducts } = require("../../lib/catalogue");

// Stands in for the hosted model: answers each question from a script (or
// says it is unsure) and remembers what it was asked. fail: no answers at all.
const UNSURE = {
  product: { audience: "unknown", kind: "unknown", confidence: 0.1 },
  size: { uk_sizes: [], confidence: 0.1 },
};
const fakeModel = ({ product = {}, size = {}, fail = false } = {}) => {
  const asked = [];
  return {
    asked,
    askAll: async (requests) => {
      asked.push(...requests);
      return new Map(
        requests.map((r) => [
          r.custom_id,
          fail ? null : (r.kind === "product" ? product : size)[r.subject] || UNSURE[r.kind],
        ])
      );
    },
  };
};

beforeEach(() => seed(data));
afterAll(() => db.end());

const subjects = (model, kind) => model.asked.filter((r) => r.kind === kind).map((r) => r.subject);

describe("AI tagging batch", () => {
  test("asks only about what the rules left unsettled (R7)", async () => {
    const model = fakeModel();
    await runAiTagging({ model, log: () => {} });
    expect(subjects(model, "product")).toEqual(["The Weekender"]);
    expect(subjects(model, "size")).toEqual(["Seaside Plus|3X"]);
  });

  test("R9: a confident answer is used and the Product is shown", async () => {
    const model = fakeModel({
      product: { "The Weekender": { audience: "women", kind: "clothes", confidence: 0.97 } },
      size: { "Seaside Plus|3X": { uk_sizes: [26], confidence: 0.95 } },
    });
    await runAiTagging({ model, log: () => {} });

    const in20 = await searchProducts({ ukSize: 20, category: "clothes" });
    expect(in20.map((p) => p.title)).toContain("The Weekender");
    const in26 = await searchProducts({ ukSize: 26, category: "activewear" });
    expect(in26.map((p) => [p.title, p.size_label])).toEqual([["High Waist Leggings", "3X"]]);
    const review = await fetchReviewList();
    expect(review.products).toEqual([]);
    expect(review.size_labels).toEqual([]);
  });

  test("R9: an answer below the confidence bar goes to the Review list instead", async () => {
    const model = fakeModel({
      product: { "The Weekender": { audience: "women", kind: "clothes", confidence: 0.6 } },
      size: { "Seaside Plus|3X": { uk_sizes: [26], confidence: 0.5 } },
    });
    await runAiTagging({ model, log: () => {} });

    expect((await searchProducts({ ukSize: 20 })).map((p) => p.title)).not.toContain("The Weekender");
    const review = await fetchReviewList();
    expect(review.products).toEqual([expect.objectContaining({ title: "The Weekender", ai_unsure: true })]);
    expect(review.size_labels).toEqual([expect.objectContaining({ size_label: "3X", ai_unsure: true })]);
  });

  test("an answer that the Product is lingerie, shoes or menswear excludes it", async () => {
    const model = fakeModel({
      product: { "The Weekender": { audience: "women", kind: "shoes", confidence: 0.99 } },
    });
    await runAiTagging({ model, log: () => {} });
    expect((await fetchReviewList()).products).toEqual([]);
    expect((await searchProducts({ ukSize: 20 })).map((p) => p.title)).not.toContain("The Weekender");
  });

  test("R8: not asked again for a stock change alone, but asked again when its text changes", async () => {
    await runAiTagging({ model: fakeModel(), log: () => {} });

    const retailer = (await db.query(`SELECT * FROM retailers WHERE retailer_name = 'Seaside Plus'`)).rows[0];
    const weekender = {
      external_id: "206:blue",
      title: "The Weekender",
      description: "",
      brand: null,
      colour: "Blue",
      product_url: "https://seaside-plus.example/products/the-weekender",
      image_url: null,
      price_in_pence: 3100,
      product_type: null,
      tags: [],
      sizes: [{ size_label: "20", in_stock: false }],
    };
    // The seeded Product has no text hash yet; a first save records it.
    await saveRetailerProducts(retailer, [weekender]);
    await runAiTagging({ model: fakeModel(), log: () => {} });

    const stockOnly = fakeModel();
    await saveRetailerProducts(retailer, [{ ...weekender, sizes: [{ size_label: "20", in_stock: true }] }]);
    await runAiTagging({ model: stockOnly, log: () => {} });
    expect(subjects(stockOnly, "product")).not.toContain("The Weekender");

    const textChanged = fakeModel();
    await saveRetailerProducts(retailer, [{ ...weekender, title: "Womens Weekender Shirt Dress" }]);
    // The rules can now settle it, so it is not sent at all.
    await runAiTagging({ model: textChanged, log: () => {} });
    expect(subjects(textChanged, "product")).toEqual([]);

    await saveRetailerProducts(retailer, [{ ...weekender, title: "The Weekender II" }]);
    const renamed = fakeModel();
    await runAiTagging({ model: renamed, log: () => {} });
    expect(subjects(renamed, "product")).toEqual(["The Weekender II"]);
  });

  test("a question that got no answer is asked again next time", async () => {
    await runAiTagging({ model: fakeModel({ fail: true }), log: () => {} });
    const again = fakeModel();
    await runAiTagging({ model: again, log: () => {} });
    expect(subjects(again, "product")).toEqual(["The Weekender"]);
    expect(subjects(again, "size")).toEqual(["Seaside Plus|3X"]);
  });

  test("a Size label is asked about once per Brand", async () => {
    await runAiTagging({ model: fakeModel(), log: () => {} });
    const again = fakeModel();
    await runAiTagging({ model: again, log: () => {} });
    expect(subjects(again, "size")).toEqual([]);
  });

  describe("Clothes types (spec 0005)", () => {
    const typeOf = async (title) =>
      (await db.query(`SELECT clothes_type FROM products WHERE title = $1`, [title])).rows[0].clothes_type;
    const untypeLinenShirt = () =>
      db.query(`UPDATE products SET title = 'The Sunday', clothes_type = NULL WHERE title = 'Linen Shirt'`);

    test("rule 7: a shown Clothes Product the rules could not type is asked about", async () => {
      await untypeLinenShirt();
      const model = fakeModel();
      await runAiTagging({ model, log: () => {} });
      expect(subjects(model, "product").sort()).toEqual(["The Sunday", "The Weekender"]);
    });

    test("rule 7: a confident type is used, and the Product stays shown either way", async () => {
      await untypeLinenShirt();
      const model = fakeModel({
        product: {
          "The Sunday": { audience: "women", kind: "clothes", clothes_type: "tops", confidence: 0.95, clothes_type_confidence: 0.95 },
          "The Weekender": { audience: "women", kind: "clothes", clothes_type: "dresses", confidence: 0.97, clothes_type_confidence: 0.5 },
        },
      });
      await runAiTagging({ model, log: () => {} });
      expect(await typeOf("The Sunday")).toBe("tops");
      expect(await typeOf("The Weekender")).toBe(null);
      const shown = (await searchProducts({ ukSize: 20, category: "clothes" })).map((p) => p.title);
      expect(shown).toEqual(expect.arrayContaining(["The Sunday", "The Weekender"]));
    });

    test("rule 7: an unsure type is not asked about again until the wording changes", async () => {
      await untypeLinenShirt();
      await runAiTagging({ model: fakeModel(), log: () => {} });
      const again = fakeModel();
      await runAiTagging({ model: again, log: () => {} });
      expect(subjects(again, "product")).not.toContain("The Sunday");
    });

    test("rule 8: a Product the AI says is not Clothes gets no Clothes type", async () => {
      const model = fakeModel({
        product: {
          "The Weekender": { audience: "women", kind: "swimwear", clothes_type: "dresses", confidence: 0.97, clothes_type_confidence: 0.97 },
        },
      });
      await runAiTagging({ model, log: () => {} });
      expect(await typeOf("The Weekender")).toBe(null);
    });

    test("an answer outside the nine types is not used", async () => {
      const model = fakeModel({
        product: {
          "The Weekender": { audience: "women", kind: "clothes", clothes_type: "capes", confidence: 0.97, clothes_type_confidence: 0.97 },
        },
      });
      await runAiTagging({ model, log: () => {} });
      expect(await typeOf("The Weekender")).toBe(null);
    });

    test("the question offers the nine types", async () => {
      await untypeLinenShirt();
      const model = fakeModel();
      await runAiTagging({ model, log: () => {} });
      const { schema } = model.asked.find((r) => r.subject === "The Sunday");
      expect(schema.properties.clothes_type.enum).toEqual(
        expect.arrayContaining(["dresses", "tops", "knitwear", "coats", "jeans", "trousers", "skirts", "jumpsuits", "nightwear"])
      );
    });
  });

  test("does nothing when there is nothing to ask", async () => {
    await db.query(`DELETE FROM products WHERE sort_status = 'unsettled' OR product_id IN
      (SELECT product_id FROM product_sizes WHERE size_status = 'unsettled')`);
    const model = fakeModel();
    model.askAll = jest.fn();
    await runAiTagging({ model, log: () => {} });
    expect(model.askAll).not.toHaveBeenCalled();
  });
});
