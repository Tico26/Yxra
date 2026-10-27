const { createPoliteFetcher } = require("../../lib/collect/polite-fetch");

// A fake web: a map of URL to body (or status), and a clock that sleeping advances.
const fakeWeb = (pages) => {
  let clock = 0;
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, at: clock, headers: options.headers });
    const page = pages[url];
    if (page === undefined) return { ok: false, status: 404, text: async () => "" };
    if (typeof page === "number") return { ok: false, status: page, text: async () => "" };
    return { ok: true, status: 200, text: async () => page, json: async () => JSON.parse(page) };
  };
  const sleep = async (ms) => {
    clock += ms;
  };
  return { fetch, sleep, now: () => clock, calls };
};

const make = (web, options = {}) =>
  createPoliteFetcher({
    fetch: web.fetch,
    sleep: web.sleep,
    now: web.now,
    contact: "hello@amaraspick.example",
    minDelayMs: 5000,
    ...options,
  });

describe("polite fetching (R4)", () => {
  test("identifies itself as AmarasPick with a contact address", async () => {
    const web = fakeWeb({ "https://shop.example/a": "A" });
    await make(web).getText("https://shop.example/a");
    web.calls.forEach((c) => expect(c.headers["User-Agent"]).toMatch(/^AmarasPick\/.*hello@amaraspick\.example/));
  });

  test("asks for the UK market, so stock and prices are what a UK shopper sees", async () => {
    const web = fakeWeb({ "https://shop.example/a": "A" });
    await make(web).getText("https://shop.example/a");
    web.calls.forEach((c) => expect(c.headers.Cookie).toBe("localization=GB"));
  });

  test("refuses to start without a contact address", () => {
    expect(() => make(fakeWeb({}), { contact: "" })).toThrow(/contact/);
  });

  test("waits several seconds between requests to the same Retailer", async () => {
    const web = fakeWeb({ "https://shop.example/a": "A", "https://shop.example/b": "B" });
    const fetcher = make(web);
    await fetcher.getText("https://shop.example/a");
    await fetcher.getText("https://shop.example/b");
    const times = web.calls.map((c) => c.at);
    for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(5000);
  });

  test("reads robots.txt once per site and honours it", async () => {
    const web = fakeWeb({
      "https://shop.example/robots.txt": "User-agent: *\nDisallow: /private",
      "https://shop.example/a": "A",
    });
    const fetcher = make(web);
    await fetcher.getText("https://shop.example/a");
    await expect(fetcher.getText("https://shop.example/private/x")).rejects.toThrow(/robots\.txt/);
    expect(web.calls.filter((c) => c.url.endsWith("robots.txt"))).toHaveLength(1);
    expect(web.calls.map((c) => c.url)).not.toContain("https://shop.example/private/x");
  });

  test("a site whose robots.txt errors is not fetched", async () => {
    const web = fakeWeb({ "https://shop.example/robots.txt": 503, "https://shop.example/a": "A" });
    await expect(make(web).getText("https://shop.example/a")).rejects.toThrow(/robots\.txt/);
  });

  test("a failed page is an error", async () => {
    const web = fakeWeb({});
    await expect(make(web).getText("https://shop.example/missing")).rejects.toThrow(/404/);
  });
});
