const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { compactTables } = require("../../db/compact");

beforeEach(() => seed(data));
afterAll(() => db.end());

describe("compactTables", () => {
  test("gives back space from rewritten rows and keeps every row", async () => {
    const count = async () =>
      (await db.query(`SELECT (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM product_sizes) AS n`))
        .rows[0].n;
    const rows = await count();
    for (let i = 0; i < 20; i++) await db.query(`UPDATE product_sizes SET in_stock = NOT in_stock`);

    const { before, after } = await compactTables();
    expect(after.product_sizes).toBeLessThan(before.product_sizes);
    expect(await count()).toBe(rows);
  });

  test("gives up quickly, with a clear reason, while a Stock check is writing", async () => {
    const client = await db.connect();
    await client.query("BEGIN");
    await client.query("UPDATE products SET last_checked_at = NOW()");
    try {
      await expect(compactTables({ lockTimeoutMs: 500 })).rejects.toThrow(
        /products is in use, most likely by a Stock check/
      );
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
