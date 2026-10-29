// The newsletter band's sign-up: POST /api/newsletter asks Brevo to send a
// "please confirm" email, and she joins the sign-ups list only once she
// clicks it (double opt-in). Brevo is never called for real; a stand-in
// fetch records what was asked of it.
const request = require("supertest");
const { app } = require("../../app");

const BREVO_SETTINGS = {
  BREVO_API_KEY: "test-key",
  BREVO_SIGNUPS_LIST_ID: "7",
  BREVO_CONFIRM_TEMPLATE_ID: "3",
};

let asked;
let reply;
const realFetch = global.fetch;

beforeEach(() => {
  Object.assign(process.env, BREVO_SETTINGS);
  asked = [];
  reply = { status: 201, body: {} };
  global.fetch = async (url, options = {}) => {
    asked.push({ url, method: options.method, headers: options.headers, body: options.body && JSON.parse(options.body) });
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  };
});
afterEach(() => {
  for (const key of Object.keys(BREVO_SETTINGS)) delete process.env[key];
  global.fetch = realFetch;
});

const signUp = (body) => request(app).post("/api/newsletter").send(body);

describe("POST /api/newsletter", () => {
  test("asks Brevo for a confirmation email that adds her to the sign-ups list", async () => {
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(asked).toEqual([
      {
        url: "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
        method: "POST",
        headers: expect.objectContaining({ "api-key": "test-key", "content-type": "application/json" }),
        body: {
          email: "amy@example.com",
          includeListIds: [7],
          templateId: 3,
          redirectionUrl: "https://amaraspick.com/newsletter/confirmed",
        },
      },
    ]);
  });

  test("tidies the address before sending it", async () => {
    await signUp({ email: "  Amy@Example.COM " });
    expect(asked[0].body.email).toBe("amy@example.com");
  });

  test("the confirmed page follows the site's own address when one is set", async () => {
    process.env.AMARAS_PICK_SITE_URL = "https://www.amaraspick.com";
    try {
      await signUp({ email: "amy@example.com" });
    } finally {
      delete process.env.AMARAS_PICK_SITE_URL;
    }
    expect(asked[0].body.redirectionUrl).toBe("https://www.amaraspick.com/newsletter/confirmed");
  });

  test.each([undefined, "", "amy", "amy@", "@example.com", "amy@example", "a b@example.com", 42])(
    "turns down %p without calling Brevo",
    async (email) => {
      const { status, body } = await signUp({ email });
      expect(status).toBe(400);
      expect(body.msg).toBe("Enter a valid email address");
      expect(asked).toEqual([]);
    }
  );

  test("turns down an address too long to be real", async () => {
    const { status } = await signUp({ email: `${"a".repeat(250)}@example.com` });
    expect(status).toBe(400);
    expect(asked).toEqual([]);
  });

  test("a filled-in hidden field (a bot) gets the same answer but nothing is sent", async () => {
    const { status, body } = await signUp({ email: "bot@example.com", website: "http://spam.example" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
    expect(asked).toEqual([]);
  });

  test("someone already on the list gets the same answer, so the form never reveals who has signed up", async () => {
    reply = { status: 400, body: { code: "duplicate_parameter", message: "Contact already exist" } };
    const { status, body } = await signUp({ email: "amy@example.com" });
    expect(status).toBe(202);
    expect(body.msg).toBe("Check your email to confirm");
  });

  test("when Brevo fails, she is asked to try again later", async () => {
    reply = { status: 500, body: { message: "Internal error" } };
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
    expect(asked).toEqual([]);
  });
});
