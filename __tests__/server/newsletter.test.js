// The newsletter band's sign-up, through Resend. POST /api/newsletter emails
// her a link to the /newsletter/confirm page; its button posts the token to
// POST /api/newsletter/confirm, which adds her to the "Newsletter sign-ups"
// segment and to "Newsletter", the one segment each broadcast goes to, then
// sends her to the confirmed page (double opt-in). Only pressing the button
// confirms, so email scanners that open links never sign anyone up. Resend
// is a stand-in kept in memory.
const request = require("supertest");
const { app } = require("../../app");
const db = require("../../db/connection");
const seed = require("../../db/seed");
const data = require("../../db/data/index");
const { confirmToken } = require("../../controllers/newsletter.controller");
const { fakeResend } = require("../fixtures/fake-resend");

const realFetch = global.fetch;
let resend;

beforeAll(() => seed(data));
afterAll(() => db.end());

beforeEach(async () => {
  await db.query("DELETE FROM newsletter_confirm_sends");
  process.env.RESEND_API_KEY = "test-key";
  resend = fakeResend();
  global.fetch = resend.fetch;
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.AMARAS_PICK_SITE_URL;
  global.fetch = realFetch;
});

const signUp = (body) => request(app).post("/api/newsletter").send(body);
const linkIn = (email) => email.html.match(/href="([^"]+)"/)[1];
const tokenIn = (link) => new URL(link).searchParams.get("token");
const confirmWith = (token) => request(app).post("/api/newsletter/confirm").type("form").send({ token });
const confirm = (link) => confirmWith(tokenIn(link));

describe("POST /api/newsletter", () => {
  test("emails her a link to confirm, and adds nobody yet", async () => {
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(resend.emails).toHaveLength(1);
    const [email] = resend.emails;
    expect(email.from).toBe("Amara's Pick <no-reply@amaraspick.com>");
    expect(email.to).toEqual(["amy@example.com"]);
    expect(email.subject).toBe("Confirm your Amara's Pick newsletter");
    expect(linkIn(email)).toMatch(/^https:\/\/amaraspick\.com\/newsletter\/confirm\?token=[\w.-]+$/);
    expect(email.text).toContain(linkIn(email));
    expect(resend.contacts).toEqual({});
  });

  test("tidies the address before sending", async () => {
    await signUp({ email: "  Amy@Example.COM " });
    expect(resend.emails[0].to).toEqual(["amy@example.com"]);
  });

  test("the link follows the site's own address when one is set", async () => {
    process.env.AMARAS_PICK_SITE_URL = "https://www.amaraspick.com/";
    await signUp({ email: "amy@example.com" });
    expect(linkIn(resend.emails[0])).toMatch(/^https:\/\/www\.amaraspick\.com\/newsletter\/confirm\?token=/);
  });

  test.each([undefined, "", "amy", "amy@", "@example.com", "amy@example", "a b@example.com", 42])(
    "turns down %p without sending anything",
    async (email) => {
      const { status, body } = await signUp({ email });
      expect(status).toBe(400);
      expect(body.msg).toBe("Enter a valid email address");
      expect(resend.emails).toEqual([]);
    }
  );

  test("turns down an address too long to be real", async () => {
    const { status } = await signUp({ email: `${"a".repeat(250)}@example.com` });
    expect(status).toBe(400);
    expect(resend.emails).toEqual([]);
  });

  test("a filled-in hidden field (a bot) gets the same answer but nothing is sent", async () => {
    const { status, body } = await signUp({ email: "bot@example.com", website: "http://spam.example" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(resend.emails).toEqual([]);
  });

  test("someone already on the list gets the same answer and email, so the form never reveals who has signed up", async () => {
    resend.contacts["amy@example.com"] = { unsubscribed: false, segments: ["Newsletter sign-ups"] };
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(resend.emails).toHaveLength(1);
  });

  test("when Resend fails, she is asked to try again later", async () => {
    resend.fail = 500;
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(502);
    expect(body.msg).toBe("Sign-up isn't working right now. Please try again later.");
  });

  test("when Resend can't be reached at all, she is asked to try again later", async () => {
    global.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(502);
    expect(body.msg).toBe("Sign-up isn't working right now. Please try again later.");
  });

  test("before Resend is set up, sign-up says it isn't open yet", async () => {
    delete process.env.RESEND_API_KEY;
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(503);
    expect(body.msg).toBe("The newsletter isn't open yet");
    expect(resend.emails).toEqual([]);
  });
});

describe("POST /api/newsletter/confirm", () => {
  const signedUpLink = async (email = "amy@example.com") => {
    await signUp({ email });
    return linkIn(resend.emails.at(-1));
  };

  test("the emailed link adds her to the sign-ups and Newsletter segments and shows the confirmed page", async () => {
    const res = await confirm(await signedUpLink());
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(resend.contacts).toEqual({
      "amy@example.com": { unsubscribed: false, segments: ["Newsletter sign-ups", "Newsletter"] },
    });
  });

  test("the segments are made once, then reused", async () => {
    await confirm(await signedUpLink("amy@example.com"));
    await confirm(await signedUpLink("bea@example.com"));
    expect(resend.segments.map((s) => s.name)).toEqual(["Newsletter sign-ups", "Newsletter"]);
    expect(Object.keys(resend.contacts).sort()).toEqual(["amy@example.com", "bea@example.com"]);
  });

  test("clicking the link twice is fine", async () => {
    const link = await signedUpLink();
    await confirm(link);
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(resend.contacts["amy@example.com"].segments).toEqual(["Newsletter sign-ups", "Newsletter"]);
  });

  test("someone on the accounts segment keeps it and joins the sign-ups segment", async () => {
    resend.segments.push({ id: "seg-acc", name: "Shopper accounts" });
    resend.contacts["amy@example.com"] = { unsubscribed: false, segments: ["Shopper accounts"] };
    await confirm(await signedUpLink());
    expect(resend.contacts["amy@example.com"].segments).toEqual(["Shopper accounts", "Newsletter sign-ups", "Newsletter"]);
  });

  test("someone who unsubscribed and confirms a new sign-up is subscribed again", async () => {
    resend.contacts["amy@example.com"] = { unsubscribed: true, segments: [] };
    await confirm(await signedUpLink());
    expect(resend.contacts["amy@example.com"]).toEqual({
      unsubscribed: false,
      segments: ["Newsletter sign-ups", "Newsletter"],
    });
  });

  test.each([
    ["no token", undefined],
    ["a made-up token", "abc.123.def"],
  ])("%s goes to the not-confirmed page and adds nobody", async (_, token) => {
    const res = await confirmWith(token);
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(resend.contacts).toEqual({});
  });

  test("a link changed to another address is turned down", async () => {
    const link = await signedUpLink("amy@example.com");
    const [payload, ...rest] = tokenIn(link).split(".");
    const other = Buffer.from("eve@example.com").toString("base64url");
    expect(payload).not.toBe(other);
    const res = await confirmWith([other, ...rest].join("."));
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(resend.contacts).toEqual({});
  });

  test("a link older than seven days is turned down", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = confirmToken("amy@example.com", eightDaysAgo + 7 * 24 * 60 * 60 * 1000);
    const res = await confirmWith(token);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(resend.contacts).toEqual({});
  });

  test("a link signed with another key is turned down", async () => {
    const link = await signedUpLink();
    process.env.RESEND_API_KEY = "rotated-key";
    resend = fakeResend({ key: "rotated-key" });
    global.fetch = resend.fetch;
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
  });

  test("when Resend fails, she goes to the not-confirmed page", async () => {
    const link = await signedUpLink();
    resend.fail = 500;
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
  });

  test("opening the link (as an email scanner does) confirms nobody", async () => {
    const link = await signedUpLink();
    const res = await request(app).get(`/api/newsletter/confirm?token=${tokenIn(link)}`);
    expect(res.status).toBe(404);
    expect(resend.contacts).toEqual({});
  });
});

describe("limits on confirmation emails", () => {
  test("asking again within a day gets the same answer but no second email", async () => {
    await signUp({ email: "amy@example.com" });
    const { status, body } = await signUp({ email: "Amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(resend.emails).toHaveLength(1);
  });

  test("a day later she can ask again", async () => {
    await signUp({ email: "amy@example.com" });
    await db.query("UPDATE newsletter_confirm_sends SET sent_at = NOW() - INTERVAL '25 hours'");
    await signUp({ email: "amy@example.com" });
    expect(resend.emails).toHaveLength(2);
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

  test("after 50 confirmation emails in a day, sign-up waits until tomorrow, keeping Resend's allowance for sign-in links", async () => {
    await db.query(
      `INSERT INTO newsletter_confirm_sends (address_hash, sent_at)
       SELECT md5(n::text), NOW() - INTERVAL '1 hour' FROM generate_series(1, 50) n`
    );
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(429);
    expect(body.msg).toBe("Lots of people are signing up today. Please try again tomorrow.");
    expect(resend.emails).toEqual([]);
  });

  test("a failed send doesn't count against her", async () => {
    resend.fail = 500;
    await signUp({ email: "amy@example.com" });
    resend.fail = null;
    await signUp({ email: "amy@example.com" });
    expect(resend.emails).toHaveLength(1);
  });
});

describe("Resend's rate limit", () => {
  test("a 429 from Resend is waited out and tried again", async () => {
    resend.rateLimitNext = 1;
    const { status } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(resend.emails).toHaveLength(1);
  });
});
