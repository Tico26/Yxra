// The nightly newsletter sync: Brevo's "Shopper accounts" list is made to
// match the Shoppers who ticked "Send me new finds and offers", and anyone who
// unsubscribed in Brevo has that box unticked on her account. Brevo is a
// stand-in kept in memory, answering the same addresses the real one does.
const fs = require("fs");
const path = require("path");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { migrate } = require("../../db/migrate");
const { syncAccountsList } = require("../../lib/newsletter-sync");
const { fakeBrevo } = require("../fixtures/fake-brevo");

const authStub = fs.readFileSync(path.join(__dirname, "../fixtures/supabase/auth-stub.sql"), "utf8");

const ACCOUNTS = "Shopper accounts";
const SIGNUPS = "Newsletter sign-ups";
const AMY = "11111111-1111-4111-8111-111111111111";
const BEA = "22222222-2222-4222-8222-222222222222";
const CAT = "33333333-3333-4333-8333-333333333333";

const realFetch = global.fetch;
let brevo;

const ticked = async () => {
  const { rows } = await db.query(
    `SELECT u.email FROM shoppers.profiles p JOIN auth.users u ON u.id = p.shopper_id
     WHERE p.news_emails ORDER BY u.email`
  );
  return rows.map((r) => r.email);
};
const untick = (id) =>
  db.query("UPDATE shoppers.profiles SET news_emails = FALSE, news_emails_at = NULL WHERE shopper_id = $1", [id]);

beforeEach(async () => {
  process.env.BREVO_API_KEY = "test-key";
  brevo = fakeBrevo({
    folders: [{ id: 1, name: "Amara's Pick" }],
    lists: [{ id: 7, name: SIGNUPS, folderId: 1 }],
  });
  global.fetch = brevo.fetch;
  await seed(data);
  await db.query("DROP SCHEMA IF EXISTS shoppers CASCADE");
  await db.query(authStub);
  await db.query("DELETE FROM auth.users");
  await db.query(
    "INSERT INTO auth.users (id, email) VALUES ($1, 'amy@example.com'), ($2, 'Bea@Example.com'), ($3, 'cat@example.com')",
    [AMY, BEA, CAT]
  );
  await migrate();
  // Amy and Bea ticked the box; Cat did not.
  await db.query(
    `INSERT INTO shoppers.profiles (shopper_id, news_emails, news_emails_at)
     VALUES ($1, TRUE, NOW()), ($2, TRUE, NOW()), ($3, FALSE, NULL)`,
    [AMY, BEA, CAT]
  );
});
afterEach(() => {
  delete process.env.BREVO_API_KEY;
  global.fetch = realFetch;
});
afterAll(async () => {
  await db.query("DROP SCHEMA IF EXISTS shoppers CASCADE");
  await db.query("DROP SCHEMA IF EXISTS auth CASCADE");
  await db.end();
});

describe("syncAccountsList", () => {
  test("adds every Shopper who ticked the box to the accounts list, and nobody else", async () => {
    const summary = await syncAccountsList();
    expect(brevo.contacts).toEqual({
      "amy@example.com": { emailBlacklisted: false, lists: [ACCOUNTS] },
      "bea@example.com": { emailBlacklisted: false, lists: [ACCOUNTS] },
    });
    expect(summary).toEqual({ added: 2, removed: 0, deleted: 0, unticked: 0 });
  });

  test("makes the accounts list once, in the Amara's Pick folder, then reuses it", async () => {
    await syncAccountsList();
    await syncAccountsList();
    expect(brevo.lists.map((l) => l.name)).toEqual([SIGNUPS, ACCOUNTS]);
    expect(brevo.lists[1].folderId).toBe(1);
    expect(brevo.folders).toHaveLength(1);
  });

  test("running it twice changes nothing the second time", async () => {
    await syncAccountsList();
    const summary = await syncAccountsList();
    expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 0 });
  });

  test("someone already on the sign-ups list keeps it when added to the accounts list", async () => {
    brevo.contacts["amy@example.com"] = { emailBlacklisted: false, lists: [SIGNUPS] };
    await syncAccountsList();
    expect(brevo.contacts["amy@example.com"]).toEqual({ emailBlacklisted: false, lists: [SIGNUPS, ACCOUNTS] });
  });

  test("adding never lifts an unsubscribe", async () => {
    brevo.contacts["amy@example.com"] = { emailBlacklisted: true, lists: [] };
    await syncAccountsList();
    expect(brevo.contacts["amy@example.com"].emailBlacklisted).toBe(true);
  });

  test("a Shopper who unsubscribed in Brevo has her box unticked", async () => {
    await syncAccountsList();
    brevo.contacts["amy@example.com"].emailBlacklisted = true;
    const summary = await syncAccountsList();
    expect(await ticked()).toEqual(["Bea@Example.com"]);
    const { rows } = await db.query("SELECT news_emails_at FROM shoppers.profiles WHERE shopper_id = $1", [AMY]);
    expect(rows[0].news_emails_at).toBeNull();
    expect(brevo.contacts["amy@example.com"]).toEqual({ emailBlacklisted: true, lists: [ACCOUNTS] });
    expect(summary.unticked).toBe(1);
  });

  test("ticking the box again after unsubscribing is unticked again, so the box never promises emails Brevo won't send", async () => {
    await syncAccountsList();
    brevo.contacts["amy@example.com"].emailBlacklisted = true;
    await syncAccountsList();
    await db.query("UPDATE shoppers.profiles SET news_emails = TRUE, news_emails_at = NOW() WHERE shopper_id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(await ticked()).toEqual(["Bea@Example.com"]);
    expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 1 });
  });

  test("a Shopper who unticked the box leaves the accounts list but stays on the sign-ups list", async () => {
    await syncAccountsList();
    brevo.contacts["amy@example.com"].lists.push(SIGNUPS);
    await untick(AMY);
    const summary = await syncAccountsList();
    expect(brevo.contacts["amy@example.com"].lists).toEqual([SIGNUPS]);
    expect(summary.removed).toBe(1);
  });

  test("a Shopper who unticked the box, and is on no other list, keeps her contact on no list", async () => {
    await syncAccountsList();
    await untick(AMY);
    await syncAccountsList();
    expect(brevo.contacts["amy@example.com"]).toEqual({ emailBlacklisted: false, lists: [] });
  });

  test("a deleted account's email is deleted from Brevo when it is on no other list", async () => {
    await syncAccountsList();
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(brevo.contacts["amy@example.com"]).toBeUndefined();
    expect(summary.deleted).toBe(1);
  });

  test("a deleted account's email that also signed up through the band only leaves the accounts list", async () => {
    await syncAccountsList();
    brevo.contacts["amy@example.com"].lists.push(SIGNUPS);
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    await syncAccountsList();
    expect(brevo.contacts["amy@example.com"]).toEqual({ emailBlacklisted: false, lists: [SIGNUPS] });
  });

  test("pages through a list longer than one page", async () => {
    brevo.lists.push({ id: 9, name: ACCOUNTS, folderId: 1 });
    for (const n of [1, 2, 3, 4]) brevo.contacts[`gone${n}@example.com`] = { emailBlacklisted: false, lists: [ACCOUNTS] };
    brevo.contacts["gone4@example.com"].lists.push(SIGNUPS);
    const summary = await syncAccountsList();
    expect(Object.keys(brevo.contacts).sort()).toEqual(["amy@example.com", "bea@example.com", "gone4@example.com"]);
    expect(summary).toEqual({ added: 2, removed: 1, deleted: 3, unticked: 0 });
  });

  test("a 429 from Brevo is waited out and tried again", async () => {
    brevo.rateLimitNext = 2;
    const summary = await syncAccountsList();
    expect(summary.added).toBe(2);
  });

  test("before Brevo is set up, it does nothing and says so", async () => {
    delete process.env.BREVO_API_KEY;
    expect(await syncAccountsList()).toEqual({ skipped: "BREVO_API_KEY is not set" });
    expect(brevo.contacts).toEqual({});
  });

  test("a Brevo error stops the sync with Brevo's message", async () => {
    process.env.BREVO_API_KEY = "wrong-key";
    await expect(syncAccountsList()).rejects.toThrow(/Brevo answered 401: Key not found/);
  });
});
