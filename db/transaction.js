const db = require("./connection");

// Runs work(client) inside one transaction, rolled back if it throws.
const withTransaction = async (work) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { withTransaction };
