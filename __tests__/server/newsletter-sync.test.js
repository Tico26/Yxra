// The nightly newsletter sync: Resend's "Shopper accounts" segment is made to
// match the Shoppers who ticked "Send me new finds and offers", each of them is
// also in "Newsletter" (the one segment broadcasts go to), and anyone who
// unsubscribed in Resend has that box unticked on her account. Resend is a
// stand-in kept in memory, answering the same addresses the real one does.
const fs = require("fs");
const path = require("path");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { migrate } = require("../../db/migrate");
const { syncAccountsList } = require("../../lib/newsletter-sync");
const { fakeResend } = require("../fixtures/fake-resend");

const authStub = fs.readFileSync(path.join(__dirname, "../fixtures/supabase/auth-stub.sql"), "utf8");

const ACCOUNTS = "Shopper accounts";
const SIGNUPS = "Newsletter sign-ups";
const NEWSLETTER = "Newsletter";
const AMY = "11111111-1111-4111-8111-111111111111";
const BEA = "22222222-2222-4222-8222-222222222222";
const CAT = "33333333-3333-4333-8333-333333333333";

const realFetch = global.fetch;
let resend;

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
  process.env.RESEND_API_KEY = "test-key";
  resend = fakeResend({ segments: [{ id: "seg-signups", name: SIGNUPS }] });
  global.fetch = resend.fetch;
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
  delete process.env.RESEND_API_KEY;
  global.fetch = realFetch;
});
afterAll(async () => {
  await db.query("DROP SCHEMA IF EXISTS shoppers CASCADE");
  await db.query("DROP SCHEMA IF EXISTS auth CASCADE");
  await db.end();
});

describe("syncAccountsList", () => {
  test("adds every Shopper who ticked the box to the accounts and Newsletter segments, and nobody else", async () => {
    const summary = await syncAccountsList();
    expect(resend.contacts).toEqual({
      "amy@example.com": { unsubscribed: false, segments: [ACCOUNTS, NEWSLETTER] },
      "bea@example.com": { unsubscribed: false, segments: [ACCOUNTS, NEWSLETTER] },
    });
    expect(summary).toEqual({ added: 2, removed: 0, deleted: 0, unticked: 0 });
  });

  test("makes the accounts and Newsletter segments once, then reuses them", async () => {
    await syncAccountsList();
    await syncAccountsList();
    expect(resend.segments.map((s) => s.name)).toEqual([SIGNUPS, ACCOUNTS, NEWSLETTER]);
  });

  test("running it twice changes nothing the second time", async () => {
    await syncAccountsList();
    const summary = await syncAccountsList();
    expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 0 });
  });

  test("someone already on the sign-ups segment keeps it when added to the accounts segment", async () => {
    resend.segments.push({ id: "seg-news", name: NEWSLETTER });
    resend.contacts["amy@example.com"] = { unsubscribed: false, segments: [SIGNUPS, NEWSLETTER] };
    await syncAccountsList();
    expect(resend.contacts["amy@example.com"]).toEqual({ unsubscribed: false, segments: [SIGNUPS, NEWSLETTER, ACCOUNTS] });
  });

  test("adding never lifts an unsubscribe", async () => {
    resend.contacts["amy@example.com"] = { unsubscribed: true, segments: [] };
    await syncAccountsList();
    expect(resend.contacts["amy@example.com"].unsubscribed).toBe(true);
  });

  test("a Shopper who unsubscribed in Resend has her box unticked", async () => {
    await syncAccountsList();
    resend.contacts["amy@example.com"].unsubscribed = true;
    const summary = await syncAccountsList();
    expect(await ticked()).toEqual(["Bea@Example.com"]);
    const { rows } = await db.query("SELECT news_emails_at FROM shoppers.profiles WHERE shopper_id = $1", [AMY]);
    expect(rows[0].news_emails_at).toBeNull();
    expect(resend.contacts["amy@example.com"]).toEqual({ unsubscribed: true, segments: [ACCOUNTS, NEWSLETTER] });
    expect(summary.unticked).toBe(1);
  });

  test("ticking the box again after unsubscribing is unticked again, so the box never promises emails Resend won't send", async () => {
    await syncAccountsList();
    resend.contacts["amy@example.com"].unsubscribed = true;
    await syncAccountsList();
    await db.query("UPDATE shoppers.profiles SET news_emails = TRUE, news_emails_at = NOW() WHERE shopper_id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(await ticked()).toEqual(["Bea@Example.com"]);
    expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 1 });
  });

  test("a Shopper who unticked the box leaves the accounts segment but, signed up through the band, stays on the Newsletter", async () => {
    await syncAccountsList();
    resend.contacts["amy@example.com"].segments.push(SIGNUPS);
    await untick(AMY);
    const summary = await syncAccountsList();
    expect(resend.contacts["amy@example.com"].segments).toEqual([NEWSLETTER, SIGNUPS]);
    expect(summary.removed).toBe(1);
  });

  test("a Shopper who unticked the box, and never signed up through the band, leaves the Newsletter too", async () => {
    await syncAccountsList();
    await untick(AMY);
    await syncAccountsList();
    expect(resend.contacts["amy@example.com"]).toEqual({ unsubscribed: false, segments: [] });
  });

  test("a deleted account's email is deleted from Resend when it is on no other segment", async () => {
    await syncAccountsList();
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(resend.contacts["amy@example.com"]).toBeUndefined();
    expect(summary.deleted).toBe(1);
  });

  test("a deleted account's email that also signed up through the band only leaves the accounts segment", async () => {
    await syncAccountsList();
    resend.contacts["amy@example.com"].segments.push(SIGNUPS);
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    await syncAccountsList();
    expect(resend.contacts["amy@example.com"]).toEqual({ unsubscribed: false, segments: [NEWSLETTER, SIGNUPS] });
  });

  test("pages through segments longer than one page", async () => {
    resend.segments.push({ id: "seg-acc", name: ACCOUNTS });
    for (const n of [1, 2, 3, 4]) resend.contacts[`gone${n}@example.com`] = { unsubscribed: false, segments: [ACCOUNTS] };
    for (const n of [1, 2, 3]) resend.contacts[`band${n}@example.com`] = { unsubscribed: false, segments: [SIGNUPS] };
    resend.contacts["gone4@example.com"].segments.push(SIGNUPS);
    const summary = await syncAccountsList();
    expect(Object.keys(resend.contacts).sort()).toEqual([
      "amy@example.com",
      "band1@example.com",
      "band2@example.com",
      "band3@example.com",
      "bea@example.com",
      "gone4@example.com",
    ]);
    expect(summary).toEqual({ added: 2, removed: 1, deleted: 3, unticked: 0 });
  });

  test("before Resend is set up, it does nothing and says so", async () => {
    delete process.env.RESEND_API_KEY;
    expect(await syncAccountsList()).toEqual({ skipped: "RESEND_API_KEY is not set" });
    expect(resend.contacts).toEqual({});
  });

  test("a Resend error stops the sync with Resend's message", async () => {
    process.env.RESEND_API_KEY = "wrong-key";
    await expect(syncAccountsList()).rejects.toThrow(/Resend answered 401: Missing API key/);
  });
});
