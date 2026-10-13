// Asks Claude many questions at once through the Message Batches API (half
// price, answered within the hour usually) and reads back one JSON answer per
// question, matched by custom_id.
const Anthropic = require("@anthropic-ai/sdk");

// A small hosted model first (spec D9); switch to a free open model if costs grow.
const TAGGING_MODEL = "claude-haiku-5-5";

const createClaudeBatchModel = ({
  client = new Anthropic(),
  model = TAGGING_MODEL,
  pollEveryMs = 60_000,
  maxWaitMs = 3 * 60 * 60_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
} = {}) => ({
  askAll: async (questions) => {
    const batch = await client.messages.batches.create({
      requests: questions.map((q) => ({
        custom_id: q.custom_id,
        params: {
          model,
          max_tokens: 4096,
          system: q.system,
          messages: [{ role: "user", content: q.prompt }],
          output_config: { format: { type: "json_schema", schema: q.schema } },
        },
      })),
    });
    log(`AI tagging: batch ${batch.id} submitted`);

    let status = batch;
    for (let waited = 0; status.processing_status !== "ended"; waited += pollEveryMs) {
      if (waited >= maxWaitMs) {
        await client.messages.batches.cancel(batch.id);
        throw new Error(`Batch ${batch.id} did not finish in time; cancelled`);
      }
      await sleep(pollEveryMs);
      status = await client.messages.batches.retrieve(batch.id);
    }

    const answers = new Map();
    for await (const item of await client.messages.batches.results(batch.id)) {
      if (item.result.type !== "succeeded") continue;
      const message = item.result.message;
      if (message.stop_reason !== "end_turn") continue; // refusal or cut short
      const text = message.content.find((block) => block.type === "text");
      try {
        answers.set(item.custom_id, JSON.parse(text.text));
      } catch {
        // Unreadable answer: asked again next run.
      }
    }
    return answers;
  },
});

module.exports = { createClaudeBatchModel, TAGGING_MODEL };
