const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { migrate } = require("../../db/migrate");
const { countClothesTypes } = require("../../lib/catalogue");

beforeEach(() => seed(data));
afterAll(() => db.end());

// What a Stock check holds while it saves a Retailer: an open transaction
// that has written to products and product_sizes.
const holdStockCheckLocks = async () => {
  const client = await db.connect();
  await client.query("BEGIN");
  await client.query("UPDATE products SET last_checked_at = NOW()");
  await client.query("UPDATE product_sizes SET last_checked_at = NOW()");
  return async () => {
    await client.query("ROLLBACK");
    client.release();
  };
};

const noWaiting = { lockTimeoutMs: 1000, retryEveryMs: 10, giveUpAfterMs: 0 };

describe("migrate", () => {
  test("runs during a Stock check when the schema is already up to date", async () => {
    const release = await holdStockCheckLocks();
    try {
      await expect(migrate(noWaiting)).resolves.toBeUndefined();
    } finally {
      await release();
    }
  });

  test("still adds what is missing", async () => {
    await db.query("DROP INDEX product_sizes_bra_band_idx");
    await db.query("ALTER TABLE click_outs DROP COLUMN bra_cup");
    await migrate(noWaiting);
    const { rows: index } = await db.query(`SELECT to_regclass('product_sizes_bra_band_idx') AS found`);
    expect(index[0].found).not.toBeNull();
    const { rows: column } = await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'click_outs' AND column_name = 'bra_cup'`
    );
    expect(column).toHaveLength(1);
  });

  test("rule 9: gives every Clothes Product already saved its type from the rules, and other Categories none", async () => {
    const { rows } = await db.query(
      `SELECT product_id, title, category FROM products WHERE sort_status = 'shown' ORDER BY product_id LIMIT 1`
    );
    const [shown] = rows;
    await db.query(
      `UPDATE products SET title = 'Cord Midi Skirt', product_type = '', tags = '{}', category = 'clothes',
         clothes_type = NULL WHERE product_id = $1`,
      [shown.product_id]
    );
    await db.query(
      `UPDATE products SET category = 'swimwear', clothes_type = 'dresses'
       WHERE product_id = (SELECT MAX(product_id) FROM products)`
    );
    await migrate(noWaiting);
    const { rows: after } = await db.query(`SELECT clothes_type FROM products WHERE product_id = $1`, [
      shown.product_id,
    ]);
    expect(after[0].clothes_type).toBe("skirts");
    const { rows: stray } = await db.query(
      `SELECT COUNT(*)::int AS n FROM products WHERE category IS DISTINCT FROM 'clothes' AND clothes_type IS NOT NULL`
    );
    expect(stray[0].n).toBe(0);
  });

  test("counts shown Clothes Products with and without a Clothes type, for the logs", async () => {
    const before = await countClothesTypes();
    await db.query(
      `UPDATE products SET clothes_type = NULL
       WHERE product_id = (SELECT MIN(product_id) FROM products WHERE sort_status = 'shown' AND category = 'clothes')`
    );
    const after = await countClothesTypes();
    expect(after.untyped).toBe(before.untyped + 1);
    expect(after.typed).toBe(before.typed - 1);
  });

  test("gives up quickly, with a clear reason, when a change it needs is blocked", async () => {
    await db.query("DROP INDEX product_sizes_bra_band_idx");
    const release = await holdStockCheckLocks();
    try {
      await expect(migrate(noWaiting)).rejects.toThrow(/in use, most likely by a Stock check/);
    } finally {
      await release();
    }
  });

  test("tries again until the table is free", async () => {
    await db.query("DROP INDEX product_sizes_bra_band_idx");
    const release = await holdStockCheckLocks();
    let waits = 0;
    const sleep = async () => {
      waits += 1;
      if (waits === 2) await release();
    };
    await migrate({ lockTimeoutMs: 200, retryEveryMs: 0, giveUpAfterMs: 60000, sleep });
    expect(waits).toBe(2);
    const { rows } = await db.query(`SELECT to_regclass('product_sizes_bra_band_idx') AS found`);
    expect(rows[0].found).not.toBeNull();
  });
});
