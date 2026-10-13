const { createClaudeBatchModel } = require("../../lib/claude-batch");

// A stand-in for the Anthropic client's Message Batches API.
const fakeClient = (results, { statuses = ["in_progress", "ended"] } = {}) => {
  const calls = { created: null, retrieved: 0, cancelled: false };
  return {
    calls,
    messages: {
      batches: {
        create: async (body) => {
          calls.created = body;
          return { id: "batch_1", processing_status: "in_progress" };
        },
        retrieve: async () => ({ id: "batch_1", processing_status: statuses[calls.retrieved++] || "ended" }),
        cancel: async () => {
          calls.cancelled = true;
        },
        results: async () =>
          (async function* () {
            yield* results;
          })(),
      },
    },
  };
};

const succeeded = (custom_id, text, stop_reason = "end_turn") => ({
  custom_id,
  result: { type: "succeeded", message: { stop_reason, content: [{ type: "text", text }] } },
});

const question = (custom_id) => ({
  custom_id,
  system: "sys",
  prompt: "Title: Wrap Dress",
  schema: { type: "object", properties: {}, additionalProperties: false },
});

const quiet = { sleep: async () => {}, log: () => {} };

describe("Claude batch model", () => {
  test("sends every question as one batch with structured JSON output on the small model", async () => {
    const client = fakeClient([]);
    await createClaudeBatchModel({ client, ...quiet }).askAll([question("a"), question("b")]);
    expect(client.calls.created.requests.map((r) => r.custom_id)).toEqual(["a", "b"]);
    expect(client.calls.created.requests[0].params).toMatchObject({
      model: "claude-haiku-5-5",
      system: "sys",
      messages: [{ role: "user", content: "Title: Wrap Dress" }],
      output_config: { format: { type: "json_schema" } },
    });
  });

  test("waits for the batch, then returns answers by custom_id", async () => {
    const client = fakeClient([
      succeeded("b", '{"confidence":0.4}'),
      succeeded("a", '{"confidence":0.95}'),
      { custom_id: "c", result: { type: "errored", error: { type: "server_error" } } },
      succeeded("d", "", "refusal"),
    ]);
    const answers = await createClaudeBatchModel({ client, ...quiet }).askAll(
      ["a", "b", "c", "d"].map(question)
    );
    expect(client.calls.retrieved).toBe(2);
    expect(Object.fromEntries(answers)).toEqual({ a: { confidence: 0.95 }, b: { confidence: 0.4 } });
  });

  test("gives up and cancels a batch that runs too long", async () => {
    const client = fakeClient([], { statuses: Array(10).fill("in_progress") });
    const model = createClaudeBatchModel({ client, pollEveryMs: 10, maxWaitMs: 30, ...quiet });
    await expect(model.askAll([question("a")])).rejects.toThrow(/did not finish/);
    expect(client.calls.cancelled).toBe(true);
  });
});
