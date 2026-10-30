// The newsletter band's sign-up, through Resend. POST /api/newsletter emails
// her a link to confirm; GET /api/newsletter/confirm (the link) adds her to
// the "Newsletter sign-ups" segment and sends her to the confirmed page
// (double opt-in). Resend is a stand-in kept in memory.
const request = require("supertest");
const { app } = require("../../app");
const { confirmToken } = require("../../controllers/newsletter.controller");
const { fakeResend } = require("../fixtures/fake-resend");

const realFetch = global.fetch;
let resend;

beforeEach(() => {
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
const confirm = (link) => request(app).get(link.replace(/^https:\/\/[^/]+/, ""));

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
    expect(linkIn(email)).toMatch(/^https:\/\/amaraspick\.com\/api\/newsletter\/confirm\?token=[\w.-]+$/);
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
    expect(linkIn(resend.emails[0])).toMatch(/^https:\/\/www\.amaraspick\.com\/api\/newsletter\/confirm\?token=/);
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

describe("GET /api/newsletter/confirm", () => {
  const signedUpLink = async (email = "amy@example.com") => {
    await signUp({ email });
    return linkIn(resend.emails.at(-1));
  };

  test("the emailed link adds her to the sign-ups segment and shows the confirmed page", async () => {
    const res = await confirm(await signedUpLink());
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(resend.contacts).toEqual({ "amy@example.com": { unsubscribed: false, segments: ["Newsletter sign-ups"] } });
  });

  test("the segment is made once, then reused", async () => {
    await confirm(await signedUpLink("amy@example.com"));
    await confirm(await signedUpLink("bea@example.com"));
    expect(resend.segments.map((s) => s.name)).toEqual(["Newsletter sign-ups"]);
    expect(Object.keys(resend.contacts).sort()).toEqual(["amy@example.com", "bea@example.com"]);
  });

  test("clicking the link twice is fine", async () => {
    const link = await signedUpLink();
    await confirm(link);
    const res = await confirm(link);
    expect(res.headers.location).toBe("/newsletter/confirmed");
    expect(resend.contacts["amy@example.com"].segments).toEqual(["Newsletter sign-ups"]);
  });

  test("someone on the accounts segment keeps it and joins the sign-ups segment", async () => {
    resend.segments.push({ id: "seg-acc", name: "Shopper accounts" });
    resend.contacts["amy@example.com"] = { unsubscribed: false, segments: ["Shopper accounts"] };
    await confirm(await signedUpLink());
    expect(resend.contacts["amy@example.com"].segments).toEqual(["Shopper accounts", "Newsletter sign-ups"]);
  });

  test("someone who unsubscribed and confirms a new sign-up is subscribed again", async () => {
    resend.contacts["amy@example.com"] = { unsubscribed: true, segments: [] };
    await confirm(await signedUpLink());
    expect(resend.contacts["amy@example.com"]).toEqual({ unsubscribed: false, segments: ["Newsletter sign-ups"] });
  });

  test.each([
    ["no token", "/api/newsletter/confirm"],
    ["a made-up token", "/api/newsletter/confirm?token=abc.123.def"],
  ])("%s goes to the not-confirmed page and adds nobody", async (_, path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(resend.contacts).toEqual({});
  });

  test("a link changed to another address is turned down", async () => {
    const link = await signedUpLink("amy@example.com");
    const [, payload, rest] = link.match(/token=([^.]+)\.(.+)$/);
    const other = Buffer.from("eve@example.com").toString("base64url");
    expect(payload).not.toBe(other);
    const res = await confirm(link.replace(`token=${payload}.${rest}`, `token=${other}.${rest}`));
    expect(res.headers.location).toBe("/newsletter/not-confirmed");
    expect(resend.contacts).toEqual({});
  });

  test("a link older than seven days is turned down", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const token = confirmToken("amy@example.com", eightDaysAgo + 7 * 24 * 60 * 60 * 1000);
    const res = await request(app).get(`/api/newsletter/confirm?token=${token}`);
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
});
