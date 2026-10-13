const { createClaudeFinder } = require("../../lib/claude-finder");

// Plays back scripted responses and records each request.
const scriptedClient = (responses) => {
  const requests = [];
  return {
    requests,
    beta: {
      messages: {
        create: async (body) => {
          requests.push(JSON.parse(JSON.stringify(body)));
          return responses.shift();
        },
      },
    },
  };
};

const handover = {
  stop_reason: "tool_use",
  content: [
    { type: "text", text: "Here they are." },
    {
      type: "tool_use",
      id: "t1",
      name: "suggest_retailers",
      input: { shops: [{ retailer_name: "Big Bloom", site_url: "https://bigbloom.example", why: "sizes 18-32" }] },
    },
  ],
};

const quiet = { log: () => {} };

describe("Claude finder", () => {
  test("searches the web and returns the shops it hands over", async () => {
    const client = scriptedClient([handover]);
    const shops = await createClaudeFinder({ client, ...quiet }).find({ knownSites: ["northern-curve.example"] });
    expect(shops).toEqual([
      { retailer_name: "Big Bloom", site_url: "https://bigbloom.example", found_via: "web search: sizes 18-32" },
    ]);
    const [request] = client.requests;
    expect(request.tools.map((t) => t.type || t.name)).toEqual(["web_search_20260209", "suggest_retailers"]);
    expect(request.messages[0].content).toMatch(/northern-curve\.example/);
  });

  test("resumes a paused search without adding a message", async () => {
    const paused = { stop_reason: "pause_turn", content: [{ type: "server_tool_use", id: "s1", name: "web_search", input: {} }] };
    const client = scriptedClient([paused, handover]);
    await createClaudeFinder({ client, ...quiet }).find();
    expect(client.requests[1].messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  test("asks for the hand-over when it answers in prose", async () => {
    const prose = { stop_reason: "end_turn", content: [{ type: "text", text: "I found some shops." }] };
    const client = scriptedClient([prose, handover]);
    const shops = await createClaudeFinder({ client, ...quiet }).find();
    expect(shops).toHaveLength(1);
    expect(client.requests[1].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  test("a declined search is an error", async () => {
    const client = scriptedClient([{ stop_reason: "refusal", content: [] }]);
    await expect(createClaudeFinder({ client, ...quiet }).find()).rejects.toThrow(/declined/);
  });
});
