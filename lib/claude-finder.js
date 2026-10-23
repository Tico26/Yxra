// Finds possible Suggested Retailers by letting Claude search the web. Its
// answer only ever becomes Suggested Retailers that Tico reviews.
const Anthropic = require("@anthropic-ai/sdk");

const FINDER_MODEL = "claude-opus-5-5";
const MAX_TURNS = 8;

const SUGGEST_TOOL = {
  name: "suggest_retailers",
  description:
    "Hand over the UK online shops you found that sell plus-size women's clothes, swimwear or activewear.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      retailers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            retailer_name: { type: "string" },
            site_url: { type: "string", description: "The shop's home page, like https://www.example.co.uk" },
            why: { type: "string", description: "One line on what plus-size range it sells" },
          },
          required: ["retailer_name", "site_url", "why"],
          additionalProperties: false,
        },
      },
    },
    required: ["retailers"],
    additionalProperties: false,
  },
};

const prompt = (knownSites) =>
  [
    "Find UK online shops that sell plus-size women's clothes, swimwear or activewear in UK size 18 and above,",
    "and ship to UK addresses. Include independent shops and brands' own sites, not only big department stores.",
    "Leave out marketplaces (Amazon, eBay, Etsy), resale sites and shops selling only shoes.",
    "Search as much as you need, then call suggest_retailers once with up to 25 shops, giving each shop's own home page.",
    knownSites.length ? `Yxra already knows these sites, so do not include them: ${knownSites.join(", ")}` : "",
  ].join(" ");

const createClaudeFinder = ({ client = new Anthropic(), log = console.log } = {}) => ({
  find: async ({ knownSites = [] } = {}) => {
    const messages = [{ role: "user", content: prompt(knownSites) }];
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.beta.messages.create({
        model: FINDER_MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 20 }, SUGGEST_TOOL],
        messages,
      });
      if (response.stop_reason === "refusal") throw new Error("The search was declined");

      const handover = response.content.find(
        (block) => block.type === "tool_use" && block.name === SUGGEST_TOOL.name
      );
      if (handover) {
        return handover.input.retailers.map((found) => ({
          retailer_name: found.retailer_name,
          site_url: found.site_url,
          found_via: `web search: ${found.why}`.slice(0, 500),
        }));
      }
      messages.push({ role: "assistant", content: response.content });
      // A paused server-side search resumes on its own; otherwise ask for the hand-over.
      if (response.stop_reason !== "pause_turn") {
        messages.push({ role: "user", content: "Please call suggest_retailers with the shops you found." });
      }
      log(`Discovery: search turn ${turn + 1} (${response.stop_reason})`);
    }
    throw new Error("Discovery search did not hand over any Retailers");
  },
});

module.exports = { createClaudeFinder, FINDER_MODEL };
