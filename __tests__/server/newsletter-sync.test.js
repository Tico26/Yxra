// The nightly newsletter sync: Brevo's accounts list is made to match the
// Shoppers who ticked "Send me new finds and offers", and anyone who
// unsubscribed in Brevo has that box unticked on her account. Brevo is a
// stand-in kept in memory, answering the same addresses the real one does.
const fs = require("fs");
const path = require("path");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { migrate } = require("../../db/migrate");
const { syncAccountsList } = require("../../lib/newsletter-sync");

const authStub = fs.readFileSync(path.join(__dirname, "../fixtures/supabase/auth-stub.sql"), "utf8");

const ACCOUNTS = 9;
const SIGNUPS = 7;
const AMY = "11111111-1111-4111-8111-111111111111";
const BEA = "22222222-2222-4222-8222-222222222222";
const CAT = "33333333-3333-4333-8333-333333333333";

// Brevo's contacts, by email: { emailBlacklisted, listIds }.
let brevo;
const realFetch = global.fetch;

const fakeBrevo = async (url, { method = "GET", headers = {}, body } = {}) => {
  if (headers["api-key"] !== "test-key") return new Response("{}", { status: 401 });
  const { pathname, searchParams } = new URL(url);
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
  const sent = body && JSON.parse(body);

  let match = pathname.match(/^\/v3\/contacts\/lists\/(\d+)\/contacts$/);
  if (match && method === "GET") {
    const listId = Number(match[1]);
    const inList = Object.entries(brevo)
      .filter(([, c]) => c.listIds.includes(listId))
      .map(([email, c]) => ({ email, emailBlacklisted: c.emailBlacklisted, listIds: c.listIds }));
    const limit = Number(searchParams.get("limit"));
    const offset = Number(searchParams.get("offset"));
    if (!(limit >= 1 && limit <= 1000)) return json({ message: "limit" }, 400);
    // Never more than two at a time, so the sync has to page through.
    return json({ contacts: inList.slice(offset, offset + Math.min(limit, 2)), count: inList.length });
  }
  if (pathname === "/v3/contacts" && method === "POST") {
    const contact = brevo[sent.email];
    if (contact && !sent.updateEnabled) return json({ code: "duplicate_parameter" }, 400);
    brevo[sent.email] = {
      emailBlacklisted: contact ? contact.emailBlacklisted : false,
      listIds: [...new Set([...(contact ? contact.listIds : []), ...sent.listIds])],
    };
    return contact ? new Response(null, { status: 204 }) : json({ id: 1 }, 201);
  }
  match = pathname.match(/^\/v3\/contacts\/lists\/(\d+)\/contacts\/remove$/);
  if (match && method === "POST") {
    const listId = Number(match[1]);
    for (const email of sent.emails) {
      if (brevo[email]) brevo[email].listIds = brevo[email].listIds.filter((id) => id !== listId);
    }
    return json({ contacts: { success: sent.emails } }, 201);
  }
  match = pathname.match(/^\/v3\/contacts\/(.+)$/);
  if (match && method === "DELETE") {
    const email = decodeURIComponent(match[1]);
    if (!brevo[email]) return json({}, 404);
    delete brevo[email];
    return new Response(null, { status: 204 });
  }
  return json({ message: `unexpected ${method} ${pathname}` }, 404);
};

const ticked = async () => {
  const { rows } = await db.query(
    `SELECT u.email FROM shoppers.profiles p JOIN auth.users u ON u.id = p.shopper_id
     WHERE p.news_emails ORDER BY u.email`
  );
  return rows.map((r) => r.email);
};

beforeEach(async () => {
  process.env.BREVO_API_KEY = "test-key";
  process.env.BREVO_ACCOUNTS_LIST_ID = String(ACCOUNTS);
  global.fetch = fakeBrevo;
  brevo = {};
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
  delete process.env.BREVO_ACCOUNTS_LIST_ID;
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
    expect(brevo).toEqual({
      "amy@example.com": { emailBlacklisted: false, listIds: [ACCOUNTS] },
      "bea@example.com": { emailBlacklisted: false, listIds: [ACCOUNTS] },
    });
    expect(summary).toEqual({ added: 2, removed: 0, deleted: 0, unticked: 0 });
  });

  test("running it twice changes nothing the second time", async () => {
    await syncAccountsList();
    const summary = await syncAccountsList();
    expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 0 });
  });

  test("someone already on the sign-ups list keeps it when added to the accounts list", async () => {
    brevo["amy@example.com"] = { emailBlacklisted: false, listIds: [SIGNUPS] };
    await syncAccountsList();
    expect(brevo["amy@example.com"].listIds.sort()).toEqual([SIGNUPS, ACCOUNTS].sort());
  });

  test("a Shopper who unsubscribed in Brevo has her box unticked and is not added back", async () => {
    brevo["amy@example.com"] = { emailBlacklisted: true, listIds: [ACCOUNTS] };
    const summary = await syncAccountsList();
    expect(await ticked()).toEqual(["Bea@Example.com"]);
    const { rows } = await db.query("SELECT news_emails_at FROM shoppers.profiles WHERE shopper_id = $1", [AMY]);
    expect(rows[0].news_emails_at).toBeNull();
    expect(brevo["amy@example.com"].emailBlacklisted).toBe(true);
    expect(summary.unticked).toBe(1);
  });

  test("a Shopper who unticked the box is taken off the accounts list but stays on the sign-ups list", async () => {
    await syncAccountsList();
    brevo["amy@example.com"].listIds.push(SIGNUPS);
    await db.query("UPDATE shoppers.profiles SET news_emails = FALSE, news_emails_at = NULL WHERE shopper_id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(brevo["amy@example.com"].listIds).toEqual([SIGNUPS]);
    expect(summary.removed).toBe(1);
  });

  test("a Shopper who unticked the box, and is on no other list, is taken off the list", async () => {
    await syncAccountsList();
    await db.query("UPDATE shoppers.profiles SET news_emails = FALSE, news_emails_at = NULL WHERE shopper_id = $1", [AMY]);
    await syncAccountsList();
    expect(brevo["amy@example.com"]).toEqual({ emailBlacklisted: false, listIds: [] });
  });

  test("a deleted account's email is deleted from Brevo when it is on no other list", async () => {
    await syncAccountsList();
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    const summary = await syncAccountsList();
    expect(brevo["amy@example.com"]).toBeUndefined();
    expect(summary.deleted).toBe(1);
  });

  test("a deleted account's email that also signed up through the band only leaves the accounts list", async () => {
    await syncAccountsList();
    brevo["amy@example.com"].listIds.push(SIGNUPS);
    await db.query("DELETE FROM auth.users WHERE id = $1", [AMY]);
    await syncAccountsList();
    expect(brevo["amy@example.com"]).toEqual({ emailBlacklisted: false, listIds: [SIGNUPS] });
  });

  test("pages through a list longer than one page", async () => {
    for (const n of [1, 2, 3, 4]) brevo[`gone${n}@example.com`] = { emailBlacklisted: false, listIds: [ACCOUNTS] };
    const summary = await syncAccountsList();
    expect(Object.keys(brevo).sort()).toEqual(["amy@example.com", "bea@example.com"]);
    expect(summary.deleted).toBe(4);
  });

  test("before Brevo is set up, it does nothing and says so", async () => {
    delete process.env.BREVO_API_KEY;
    expect(await syncAccountsList()).toEqual({ skipped: "BREVO_API_KEY or BREVO_ACCOUNTS_LIST_ID is not set" });
    expect(brevo).toEqual({});
  });

  test("a Brevo error stops the sync with Brevo's message", async () => {
    process.env.BREVO_API_KEY = "wrong-key";
    await expect(syncAccountsList()).rejects.toThrow(/Brevo .* 401/);
  });
});

test("ticking the box again after unsubscribing is unticked again, so the box never promises emails Brevo won't send", async () => {
  brevo["amy@example.com"] = { emailBlacklisted: true, listIds: [ACCOUNTS] };
  await syncAccountsList();
  await db.query("UPDATE shoppers.profiles SET news_emails = TRUE, news_emails_at = NOW() WHERE shopper_id = $1", [AMY]);
  const summary = await syncAccountsList();
  expect(await ticked()).toEqual(["Bea@Example.com"]);
  expect(summary).toEqual({ added: 0, removed: 0, deleted: 0, unticked: 1 });
});
