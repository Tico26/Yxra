const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { runPhotoCheck, smallPhoto, isProfessional } = require("../../lib/photo-check");

const PRO = { worn_by_model: true, plain_background: true, whole_garment_in_view: true, sharp: true };
const FLAT_LAY = { ...PRO, worn_by_model: false };

// Stands in for the hosted model: answers every photo the same way, or with
// answers picked by product id, and remembers what it was asked.
const fakeModel = (answerFor) => {
  const asked = [];
  return {
    asked,
    askAll: async (requests) => {
      asked.push(...requests);
      return new Map(requests.map((r) => [r.custom_id, answerFor(r.product)]));
    },
  };
};

beforeEach(async () => {
  await seed(data);
  await db.query(`UPDATE products SET image_url = 'https://img.example/' || product_id || '.jpg'`);
});
afterAll(() => db.end());

const shownWithPhoto = async () =>
  (
    await db.query(
      `SELECT p.product_id FROM products p JOIN retailers r USING (retailer_id)
       WHERE p.sort_status = 'shown' AND r.removed_at IS NULL AND p.missing_since IS NULL
       ORDER BY p.product_id`
    )
  ).rows.map((r) => r.product_id);

describe("photo check", () => {
  test("asks once about each shown Product's photo, sending the photo itself", async () => {
    const model = fakeModel(() => PRO);
    await runPhotoCheck({ model, log: () => {} });
    expect(model.asked.map((q) => q.product.product_id)).toEqual(await shownWithPhoto());
    expect(model.asked[0].prompt[0]).toMatchObject({ type: "image", source: { type: "url" } });

    const again = fakeModel(() => PRO);
    await runPhotoCheck({ model: again, log: () => {} });
    expect(again.asked).toEqual([]);
  });

  test("only a model shot on a plain background, whole and sharp, counts as professional", async () => {
    const ids = await shownWithPhoto();
    const model = fakeModel((p) => (p.product_id === ids[0] ? PRO : FLAT_LAY));
    const result = await runPhotoCheck({ model, log: () => {} });
    expect(result.professional).toBe(1);
    const { rows } = await db.query(
      `SELECT product_id FROM products WHERE photo_professional ORDER BY product_id`
    );
    expect(rows.map((r) => r.product_id)).toEqual([ids[0]]);
  });

  test("a changed photo is asked about again", async () => {
    await runPhotoCheck({ model: fakeModel(() => PRO), log: () => {} });
    const [id] = await shownWithPhoto();
    await db.query(`UPDATE products SET image_url = 'https://img.example/new.jpg' WHERE product_id = $1`, [id]);
    const model = fakeModel(() => FLAT_LAY);
    await runPhotoCheck({ model, log: () => {} });
    expect(model.asked.map((q) => q.product.product_id)).toEqual([id]);
  });

  test("a photo with no answer is asked about again next run", async () => {
    await runPhotoCheck({ model: fakeModel(() => null), log: () => {} });
    const model = fakeModel(() => PRO);
    await runPhotoCheck({ model, log: () => {} });
    expect(model.asked.length).toBe((await shownWithPhoto()).length);
  });

  test("Shopify photos are sent small; others as they are", () => {
    expect(smallPhoto("https://cdn.shopify.com/s/files/1/dress.jpg?v=1")).toBe(
      "https://cdn.shopify.com/s/files/1/dress.jpg?v=1&width=512"
    );
    expect(smallPhoto("https://shop.example/cdn/shop/files/dress.jpg")).toBe(
      "https://shop.example/cdn/shop/files/dress.jpg?width=512"
    );
    expect(smallPhoto("https://img.example/dress.jpg")).toBe("https://img.example/dress.jpg");
  });

  test("isProfessional needs every part", () => {
    expect(isProfessional(PRO)).toBe(true);
    for (const key of Object.keys(PRO)) expect(isProfessional({ ...PRO, [key]: false })).toBe(false);
  });
});
