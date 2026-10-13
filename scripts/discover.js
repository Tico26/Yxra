// Looks for new UK plus-size shops and adds the readable ones as Suggested
// Retailers for Tico to approve or reject on the Review list (/admin).
const db = require("../db/connection");
const { runDiscovery } = require("../lib/discovery");
const { createClaudeFinder } = require("../lib/claude-finder");
const { createPoliteFetcher } = require("../lib/collect/polite-fetch");

const main = async () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY to run discovery");
  await runDiscovery({ finder: createClaudeFinder(), fetcher: createPoliteFetcher() });
};

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
