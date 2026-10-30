// The newsletter band's sign-up, through Brevo. POST /api/newsletter emails
// her a link to the /newsletter/confirm page; its button posts the token to
// POST /api/newsletter/confirm, which adds her to Brevo's "Newsletter
// sign-ups" list and sends her to the confirmed page (double opt-in). Only
// pressing the button confirms, so email scanners that open links never sign
// anyone up. Brevo is a stand-in kept in memory.
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { confirmToken } = require("../../controllers/newsletter.controller");
const { fakeBrevo } = require("../fixtures/fake-brevo");

const realFetch = global.fetch;
let brevo;

beforeAll(() => seed(data));
afterAll(() => db.end());

beforeEach(async () => {
  await db.query("DELETE FROM newsletter_confirm_sends");
  process.env.BREVO_API_KEY = "test-key";
  brevo = fakeBrevo();
  global.fetch = brevo.fetch;
});
afterEach(() => {
  delete process.env.BREVO_API_KEY;
  delete process.env.AMARAS_PICK_SITE_URL;
  global.fetch = realFetch;
});

const signUp = (body) => request(app).post("/api/newsletter").send(body);
const linkIn = (email) => email.htmlContent.match(/href="([^"]+)"/)[1];
const tokenIn = (link) => new URL(link).searchParams.get("token");
const confirmWith = (token) => request(app).post("/api/newsletter/confirm").type("form").send({ token });
const confirm = (link) => confirmWith(tokenIn(link));

describe("POST /api/newsletter", () => {
  test("emails her a link to confirm, and adds nobody yet", async () => {
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(brevo.emails).toHaveLength(1);
    const [email] = brevo.emails;
    expect(email.sender).toEqual({ name: "Amara's Pick", email: "no-reply@amaraspick.com" });
    expect(email.to).toEqual([{ email: "amy@example.com" }]);
    expect(email.subject).toBe("Confirm your Amara's Pick newsletter");
    expect(linkIn(email)).toMatch(/^https:\/\/amaraspick\.com\/newsletter\/confirm\?token=[\w.-]+$/);
    expect(email.textContent).toContain(linkIn(email));
    expect(brevo.contacts).toEqual({});
  });

  test("tidies the address before sending", async () => {
    await signUp({ email: "  Amy@Example.COM " });
    expect(brevo.emails[0].to).toEqual([{ email: "amy@example.com" }]);
  });

  test("the link follows the site's own address when one is set", async () => {
    process.env.AMARAS_PICK_SITE_URL = "https://www.amaraspick.com/";
    await signUp({ email: "amy@example.com" });
    expect(linkIn(brevo.emails[0])).toMatch(/^https:\/\/www\.amaraspick\.com\/newsletter\/confirm\?token=/);
  });

  test.each([undefined, "", "amy", "amy@", "@example.com", "amy@example", "a b@example.com", 42])(
    "turns down %p without sending anything",
    async (email) => {
      const { status, body } = await signUp({ email });
      expect(status).toBe(400);
      expect(body.msg).toBe("Enter a valid email address");
      expect(brevo.emails).toEqual([]);
    }
  );

  test("turns down an address too long to be real", async () => {
    const { status } = await signUp({ email: `${"a".repeat(250)}@example.com` });
    expect(status).toBe(400);
    expect(brevo.emails).toEqual([]);
  });

  test("a filled-in hidden field (a bot) gets the same answer but nothing is sent", async () => {
    const { status, body } = await signUp({ email: "bot@example.com", website: "http://spam.example" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(brevo.emails).toEqual([]);
  });

  test("someone already on the list gets the same answer and email, so the form never reveals who has signed up", async () => {
    brevo.contacts["amy@example.com"] = { emailBlacklisted: false, lists: ["Newsletter sign-ups"] };
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(brevo.emails).toHaveLength(1);
  });

  test("when Brevo fails, she is asked to try again later", async () => {
    brevo.fail = 500;
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(502);
    expect(body.msg).toBe("Sign-up isn't working right now. Please try again later.");
  });

  test("when Brevo can't be reached at all, she is asked to try again later", async () => {
    global.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(502);
    expect(body.msg).toBe("Sign-up isn't working right now. Please try again later.");
  });

  test("before Brevo is set up, sign-up says it isn't open yet", async () => {
    delete process.env.BREVO_API_KEY;
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(503);
    expect(body.msg).toBe("The newsletter isn't open yet");
    expect(brevo.emails).toEqual([]);
  });
});

describe("POST /api/newsletter/confirm", () => {
  const signedUpLink = async (email = "amy@example.com") => {
    await signUp({ email });
    return linkIn(brevo.emails.at(-1));
  };

  test("pressing the button adds her to the sign-ups list and shows the confirmed page", async () => {
    const res = await confirm(await signedUpLink());
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(brevo.contacts).toEqual({ "amy@example.com": { emailBlacklisted: false, lists: ["Newsletter sign-ups"] } });
  });

  test("the list is made once, in an Amara's Pick folder, then reused", async () => {
    await confirm(await signedUpLink("amy@example.com"));
    await confirm(await signedUpLink("bea@example.com"));
    expect(brevo.folders.map((f) => f.name)).toEqual(["Amara's Pick"]);
    expect(brevo.lists.map((l) => l.name)).toEqual(["Newsletter sign-ups"]);
    expect(Object.keys(brevo.contacts).sort()).toEqual(["amy@example.com", "bea@example.com"]);
  });

  test("clicking the link twice is fine", async () => {
    const link = await signedUpLink();
    await confirm(link);
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(brevo.contacts["amy@example.com"].lists).toEqual(["Newsletter sign-ups"]);
  });

  test("an existing list of that name in another folder is reused", async () => {
    brevo.folders.push({ id: 1, name: "Your first folder" });
    brevo.lists.push({ id: 2, name: "Newsletter sign-ups", folderId: 1 });
    await confirm(await signedUpLink());
    expect(brevo.lists).toHaveLength(1);
    expect(brevo.contacts["amy@example.com"].lists).toEqual(["Newsletter sign-ups"]);
  });

  test("someone on the accounts list keeps it and joins the sign-ups list", async () => {
    brevo.folders.push({ id: 1, name: "Amara's Pick" });
    brevo.lists.push({ id: 3, name: "Shopper accounts", folderId: 1 });
    brevo.contacts["amy@example.com"] = { emailBlacklisted: false, lists: ["Shopper accounts"] };
    await confirm(await signedUpLink());
    expect(brevo.contacts["amy@example.com"].lists).toEqual(["Shopper accounts", "Newsletter sign-ups"]);
  });

  test("someone who unsubscribed and confirms a new sign-up is subscribed again", async () => {
    brevo.contacts["amy@example.com"] = { emailBlacklisted: true, lists: [] };
    await confirm(await signedUpLink());
    expect(brevo.contacts["amy@example.com"]).toEqual({ emailBlacklisted: false, lists: ["Newsletter sign-ups"] });
  });

  test.each([
    ["no token", undefined],
    ["a made-up token", "abc.123.def"],
  ])("%s goes to the not-confirmed page and adds nobody", async (_, token) => {
    const res = await confirmWith(token);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(brevo.contacts).toEqual({});
  });

  test("a link changed to another address is turned down", async () => {
    const link = await signedUpLink("amy@example.com");
    const [payload, ...rest] = tokenIn(link).split(".");
    const other = Buffer.from("eve@example.com").toString("base64url");
    expect(payload).not.toBe(other);
    const res = await confirmWith([other, ...rest].join("."));
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(brevo.contacts).toEqual({});
  });

  test("a link older than seven days is turned down", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = confirmToken("amy@example.com", eightDaysAgo + 7 * 24 * 60 * 60 * 1000);
    const res = await confirmWith(token);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(brevo.contacts).toEqual({});
  });

  test("a link signed with another key is turned down", async () => {
    const link = await signedUpLink();
    process.env.BREVO_API_KEY = "rotated-key";
    brevo = fakeBrevo({ key: "rotated-key" });
    global.fetch = brevo.fetch;
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
  });

  test("when Brevo fails, she goes to the not-confirmed page", async () => {
    const link = await signedUpLink();
    brevo.fail = 500;
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
  });

  test("opening the link (as an email scanner does) confirms nobody", async () => {
    const link = await signedUpLink();
    const res = await request(app).get(`/api/newsletter/confirm?token=${tokenIn(link)}`);
    expect(res.status).toBe(404);
    expect(brevo.contacts).toEqual({});
  });
});

describe("limits on confirmation emails", () => {
  test("asking again within a day gets the same answer but no second email", async () => {
    await signUp({ email: "amy@example.com" });
    const { status, body } = await signUp({ email: "Amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(brevo.emails).toHaveLength(1);
  });

  test("a day later she can ask again", async () => {
    await signUp({ email: "amy@example.com" });
    await db.query("UPDATE newsletter_confirm_sends SET sent_at = NOW() - INTERVAL '25 hours'");
    await signUp({ email: "amy@example.com" });
    expect(brevo.emails).toHaveLength(2);
  });

  test("only a fingerprint of the address is kept, and only for a day", async () => {
    await db.query(
      "INSERT INTO newsletter_confirm_sends (address_hash, sent_at) VALUES ('old', NOW() - INTERVAL '2 days')"
    );
    await signUp({ email: "amy@example.com" });
    const { rows } = await db.query("SELECT address_hash FROM newsletter_confirm_sends");
    expect(rows).toHaveLength(1);
    expect(rows[0].address_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain("amy");
  });

  test("after 50 confirmation emails in a day, sign-up waits until tomorrow, keeping most of Brevo's 300 a day for the newsletter itself", async () => {
    await db.query(
      `INSERT INTO newsletter_confirm_sends (address_hash, sent_at)
       SELECT md5(n::text), NOW() - INTERVAL '1 hour' FROM generate_series(1, 50) n`
    );
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(429);
    expect(body.msg).toBe("Lots of people are signing up today. Please try again tomorrow.");
    expect(brevo.emails).toEqual([]);
  });

  test("a failed send doesn't count against her", async () => {
    brevo.fail = 500;
    await signUp({ email: "amy@example.com" });
    brevo.fail = null;
    await signUp({ email: "amy@example.com" });
    expect(brevo.emails).toHaveLength(1);
  });
});

describe("Brevo's rate limit", () => {
  test("a 429 from Brevo is waited out and tried again", async () => {
    brevo.rateLimitNext = 1;
    const { status } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(brevo.emails).toHaveLength(1);
  });
});
