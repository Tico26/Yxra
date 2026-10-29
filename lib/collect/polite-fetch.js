// Every request Amara's Pick makes to a Retailer goes through here (spec rule R4):
// it honours robots.txt, waits between requests to the same site, and says
// who is asking.
const { parseRobots } = require("./robots");

const AGENT = "AmarasPick";

class FetchError extends Error {}

const createPoliteFetcher = ({
  fetch = globalThis.fetch,
  contact = process.env.AMARAS_PICK_CONTACT,
  minDelayMs = 5000,
  timeoutMs = 30000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
} = {}) => {
  if (!contact) {
    throw new Error("Set AMARAS_PICK_CONTACT to the contact address Amara's Pick gives Retailers");
  }
  const userAgent = `${AGENT}/1.0 (+${contact})`;
  const lastRequestAt = new Map();
  const robotsBySite = new Map();

  const request = async (url) => {
    const { origin } = new URL(url);
    const last = lastRequestAt.get(origin);
    if (last !== undefined) {
      const wait = last + minDelayMs - now();
      if (wait > 0) await sleep(wait);
    }
    lastRequestAt.set(origin, now());
    return fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json, text/html, */*",
        // Amara's Pick shoppers buy in the UK. Shopify otherwise picks the market from
        // our IP, and a shop selling only to the UK reports every size as
        // unavailable (and prices in dollars) to a collector in the US.
        Cookie: "localization=GB",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
  };

  const robotsFor = async (origin) => {
    if (!robotsBySite.has(origin)) {
      const response = await request(`${origin}/robots.txt`);
      let robots;
      if (response.ok) robots = parseRobots(await response.text());
      // No robots.txt means no rules; a server error means stay away.
      else if (response.status >= 400 && response.status < 500) robots = parseRobots("");
      else robots = null;
      robotsBySite.set(origin, robots);
    }
    return robotsBySite.get(origin);
  };

  const get = async (url) => {
    const { origin, pathname, search } = new URL(url);
    const robots = await robotsFor(origin);
    if (!robots || !robots.isAllowed(pathname + search, AGENT)) {
      throw new FetchError(`robots.txt does not allow ${url}`);
    }
    const response = await request(url);
    if (!response.ok) throw new FetchError(`${url} answered ${response.status}`);
    return response;
  };

  return {
    userAgent,
    getText: async (url) => (await get(url)).text(),
    getJson: async (url) => JSON.parse(await (await get(url)).text()),
    getBytes: async (url) => Buffer.from(await (await get(url)).arrayBuffer()),
    sitemapsFor: async (siteUrl) => {
      const robots = await robotsFor(new URL(siteUrl).origin);
      return robots ? robots.sitemaps : [];
    },
  };
};

module.exports = { createPoliteFetcher, FetchError };
