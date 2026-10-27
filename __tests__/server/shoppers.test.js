// Spec 0004 rules 14, 19 and 20: what the browser key can reach once
// db/shoppers.sql is applied. Each query runs as Supabase runs a browser
// request: as the anon or authenticated role, with the signed-in id set.
const fs = require("fs");
const path = require("path");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { migrate } = require("../../db/migrate");

const authStub = fs.readFileSync(path.join(__dirname, "../fixtures/supabase/auth-stub.sql"), "utf8");

const AMY = "11111111-1111-4111-8111-111111111111";
const BEA = "22222222-2222-4222-8222-222222222222";

// Runs fn(query) in a transaction as that role, rolled back afterwards
// unless keep is set.
const as = async (role, shopperId, fn, { keep = false } = {}) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [shopperId || ""]);
    const result = await fn((...args) => client.query(...args));
    if (keep) await client.query("COMMIT");
    return result;
  } finally {
    if (!keep) await client.query("ROLLBACK");
    client.release();
  }
};
const asShopper = (id, fn) => as("authenticated", id, fn);
const asVisitor = (fn) => as("anon", null, fn);

let productIds;

beforeEach(async () => {
  await seed(data);
  await db.query("DROP SCHEMA IF EXISTS shoppers CASCADE");
  await db.query(authStub);
  await db.query("DELETE FROM auth.users");
  await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'amy@example.com'), ($2, 'bea@example.com')", [AMY, BEA]);
  await migrate();
  const { rows } = await db.query("SELECT product_id FROM products ORDER BY product_id LIMIT 2");
  productIds = rows.map((r) => r.product_id);
  // Saved as the owner, as if each had tapped the heart earlier.
  await db.query(
    "INSERT INTO shoppers.saved_items (shopper_id, product_id) VALUES ($1, $3), ($2, $4)",
    [AMY, BEA, ...productIds]
  );
  await db.query("INSERT INTO shoppers.profiles (shopper_id, uk_size) VALUES ($1, 22), ($2, 26)", [AMY, BEA]);
});
afterAll(async () => {
  await db.query("DROP SCHEMA IF EXISTS shoppers CASCADE");
  await db.query("DROP SCHEMA IF EXISTS auth CASCADE");
  await db.end();
});

describe("Saved items", () => {
  test("a Shopper sees only her own Saved items", async () => {
    const rows = await asShopper(AMY, async (q) => (await q("SELECT * FROM shoppers.saved_items")).rows);
    expect(rows.map((r) => [r.shopper_id, r.product_id])).toEqual([[AMY, productIds[0]]]);
  });

  test("a Shopper can save and remove a Product, filling in her own id", async () => {
    await asShopper(AMY, async (q) => {
      await q("INSERT INTO shoppers.saved_items (product_id) VALUES ($1)", [productIds[1]]);
      await q("DELETE FROM shoppers.saved_items WHERE product_id = $1", [productIds[0]]);
      const { rows } = await q("SELECT product_id FROM shoppers.saved_items");
      expect(rows.map((r) => r.product_id)).toEqual([productIds[1]]);
    });
  });

  test("a Shopper cannot save for someone else or remove their saves", async () => {
    await asShopper(AMY, async (q) => {
      await expect(
        q("INSERT INTO shoppers.saved_items (shopper_id, product_id) VALUES ($1, $2)", [BEA, productIds[0]])
      ).rejects.toThrow(/row-level security/);
    });
    const removed = await asShopper(AMY, async (q) =>
      (await q("DELETE FROM shoppers.saved_items WHERE shopper_id = $1", [BEA])).rowCount
    );
    expect(removed).toBe(0);
  });

  test("rule 14: deleting a Product takes it off every Saved page", async () => {
    await db.query("DELETE FROM products WHERE product_id = $1", [productIds[0]]);
    const { rows } = await db.query("SELECT product_id FROM shoppers.saved_items");
    expect(rows.map((r) => r.product_id)).toEqual([productIds[1]]);
  });
});

describe("Profiles", () => {
  test("a Shopper reads and changes only her own size", async () => {
    await asShopper(AMY, async (q) => {
      await q("UPDATE shoppers.profiles SET uk_size = 24");
      const { rows } = await q("SELECT shopper_id, uk_size FROM shoppers.profiles");
      expect(rows).toEqual([{ shopper_id: AMY, uk_size: 24 }]);
    });
    const { rows } = await db.query("SELECT uk_size FROM shoppers.profiles WHERE shopper_id = $1", [BEA]);
    expect(rows[0].uk_size).toBe(26);
  });

  test("news emails are only wanted with the date she ticked the box", async () => {
    await asShopper(AMY, async (q) => {
      await expect(q("UPDATE shoppers.profiles SET news_emails = true")).rejects.toThrow(/check constraint/);
    });
  });
});

describe("rule 19: Delete my account", () => {
  test("removes her account, Saved items and profile, and nobody else's", async () => {
    await as("authenticated", AMY, (q) => q("SELECT shoppers.delete_my_account()"), { keep: true });
    const users = await db.query("SELECT id FROM auth.users");
    const saves = await db.query("SELECT shopper_id FROM shoppers.saved_items");
    const profiles = await db.query("SELECT shopper_id FROM shoppers.profiles");
    expect(users.rows.map((r) => r.id)).toEqual([BEA]);
    expect(saves.rows.map((r) => r.shopper_id)).toEqual([BEA]);
    expect(profiles.rows.map((r) => r.shopper_id)).toEqual([BEA]);
  });

  test("a signed-out visitor cannot call it", async () => {
    await asVisitor(async (q) => {
      await expect(q("SELECT shoppers.delete_my_account()")).rejects.toThrow(/permission denied/);
    });
  });
});

describe("rule 20: the browser key reaches nothing else", () => {
  test.each(["products", "product_sizes", "retailers", "click_outs", "suggested_retailers", "size_translations"])(
    "%s is closed to signed-out and signed-in visitors",
    async (table) => {
      await asVisitor(async (q) => {
        await expect(q(`SELECT * FROM public.${table}`)).rejects.toThrow(/permission denied/);
      });
      await asShopper(AMY, async (q) => {
        await expect(q(`SELECT * FROM public.${table}`)).rejects.toThrow(/permission denied/);
      });
    }
  );

  test("a signed-out visitor cannot read any Saved items or profiles", async () => {
    for (const table of ["saved_items", "profiles"]) {
      await asVisitor(async (q) => {
        await expect(q(`SELECT * FROM shoppers.${table}`)).rejects.toThrow(/permission denied/);
      });
    }
  });

  test("every public table has row-level security on", async () => {
    const { rows } = await db.query(
      `SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`
    );
    expect(rows).toEqual([]);
  });

  test("migrating again changes nothing and keeps the saves", async () => {
    await migrate();
    const { rows } = await db.query("SELECT count(*)::int AS n FROM shoppers.saved_items");
    expect(rows[0].n).toBe(2);
  });
});

describe("migrating on Supabase", () => {
  test("runs during a Stock check when everything is already in place", async () => {
    const client = await db.connect();
    await client.query("BEGIN");
    await client.query("UPDATE products SET last_checked_at = NOW()");
    await client.query("UPDATE product_sizes SET last_checked_at = NOW()");
    try {
      await expect(migrate({ lockTimeoutMs: 1000, retryEveryMs: 10, giveUpAfterMs: 0 })).resolves.toBeUndefined();
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
