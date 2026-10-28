// Runs the AI tagging batch for whatever the rules left unsettled, then
// judges the photos not judged yet (lib/photo-check.js). Skips quietly when
// no Anthropic API key is set.
const db = require("../db/connection");
const { runAiTagging } = require("../lib/ai-tagging");
const { runPhotoCheck } = require("../lib/photo-check");
const { createClaudeBatchModel } = require("../lib/claude-batch");

const main = async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("AI tagging skipped: ANTHROPIC_API_KEY is not set");
    return;
  }
  const model = createClaudeBatchModel();
  await runAiTagging({ model });
  await runPhotoCheck({ model });
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
