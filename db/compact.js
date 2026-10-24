// Gives back the disk space left behind by rewritten rows in the busiest
// tables, so the database stays inside its size limit. VACUUM FULL rewrites
// a table and locks it while it does (seconds at today's size), so it gives
// up at once if a Stock check or anything else is using the table, instead
// of holding up the live site behind it.
const db = require("./connection");

const TABLES = ["products", "product_sizes"];

const sizes = async (client) => {
  const { rows } = await client.query(
    `SELECT relname AS table_name, pg_total_relation_size(oid) AS bytes
     FROM pg_class WHERE relname = ANY ($1) ORDER BY relname`,
    [TABLES]
  );
  return Object.fromEntries(rows.map((r) => [r.table_name, Number(r.bytes)]));
};

const compactTables = async ({ lockTimeoutMs = 5000 } = {}) => {
  // VACUUM cannot run inside a transaction, so it gets a connection of its own.
  const client = await db.connect();
  try {
    await client.query(`SET lock_timeout = ${Number(lockTimeoutMs)}`);
    const before = await sizes(client);
    for (const table of TABLES) {
      try {
        await client.query(`VACUUM (FULL, ANALYZE) ${table}`);
      } catch (err) {
        if (err.code === "55P03") {
          err.message = `${table} is in use, most likely by a Stock check; try again when it has finished`;
        }
        throw err;
      }
    }
    return { before, after: await sizes(client) };
  } finally {
    client.release();
  }
};

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

if (require.main === module) {
  compactTables()
    .then(({ before, after }) => {
      for (const table of TABLES) {
        console.log(`${table}: ${megabytes(before[table])} -> ${megabytes(after[table])}`);
      }
    })
    .finally(() => db.end());
}

module.exports = { compactTables };
