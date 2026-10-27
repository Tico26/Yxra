// Spec 0002 build step 1: is Cloudflare Workers Free's 10 ms CPU limit enough?
// Loads the home page, searches and Click-outs on the live site in separate
// time windows, waits for Cloudflare's analytics to catch up, then prints the
// CPU time each Worker used in each window. Exits 1 if any p99 is over 10 ms.
//
//   SITE_URL=https://amaraspick.co.uk API_URL=https://amaras-pick-api.<you>.workers.dev \
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/hosting-test.mjs
//
// The token needs Account Analytics: Read. Each Click-out here is a real one,
// so it is recorded in click_outs like any other.
const { SITE_URL, API_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;
const LIMIT_MS = 10;
const ANALYTICS_DELAY_MS = 4 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [name, value] of Object.entries({ SITE_URL, API_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID })) {
  if (!value) throw new Error(`Set ${name}`);
}

const get = async (url, init) => {
  const res = await fetch(url, { redirect: "manual", ...init });
  if (res.status >= 500) throw new Error(`${url} answered ${res.status}`);
  await res.arrayBuffer();
  return res.status;
};

// Runs one window of requests and returns when it started and ended.
const window = async (label, urls) => {
  const since = new Date();
  for (const url of urls) console.log(`${label}: ${await get(url)} ${url}`);
  const until = new Date();
  await sleep(65_000); // keep the windows apart
  return { label, since, until };
};

const size = 22;
const { products } = await (await fetch(`${API_URL}/api/products?uk_size=${size}`)).json();
if (!products.length) throw new Error(`No Products in stock in a ${size}: run the Stock check first`);

const windows = [
  await window("home page", Array(10).fill(`${SITE_URL}/`)),
  await window("search", Array(10).fill(`${SITE_URL}/?size=${size}`)),
  await window(
    "click-out",
    products.slice(0, 5).map((p) => `${SITE_URL}/go/${p.product_id}?size=${size}`)
  ),
];

console.log(`\nWaiting ${ANALYTICS_DELAY_MS / 60000} minutes for Cloudflare's analytics...`);
await sleep(ANALYTICS_DELAY_MS);

const QUERY = `query ($account: string!, $since: Time!, $until: Time!) {
  viewer { accounts(filter: { accountTag: $account }) {
    workersInvocationsAdaptive(limit: 20, filter: { datetime_geq: $since, datetime_leq: $until }) {
      dimensions { scriptName }
      sum { requests errors }
      quantiles { cpuTimeP50 cpuTimeP99 }
    }
  } }
}`;

let over = false;
for (const { label, since, until } of windows) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { account: CLOUDFLARE_ACCOUNT_ID, since: since.toISOString(), until: new Date(until.getTime() + 5000).toISOString() },
    }),
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
  const rows = body.data.viewer.accounts[0]?.workersInvocationsAdaptive || [];
  console.log(`\n${label}`);
  if (!rows.length) console.log("  no data yet: run again in a few minutes");
  for (const { dimensions, sum, quantiles } of rows) {
    const p50 = quantiles.cpuTimeP50 / 1000;
    const p99 = quantiles.cpuTimeP99 / 1000;
    if (p99 > LIMIT_MS) over = true;
    console.log(
      `  ${dimensions.scriptName}: ${sum.requests} requests, ${sum.errors} errors, CPU p50 ${p50.toFixed(1)} ms, p99 ${p99.toFixed(1)} ms${p99 > LIMIT_MS ? "  OVER 10 ms" : ""}`
    );
  }
}

console.log(over ? "\nSomething went over 10 ms (spec 0002 D2)." : "\nEverything stayed under 10 ms.");
process.exit(over ? 1 : 0);
