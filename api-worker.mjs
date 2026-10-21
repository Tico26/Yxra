// The Express API on Cloudflare Workers (spec 0002, D2). Each request gets its
// own one-connection pool through Hyperdrive, closed once the response is out.
// Locally the same app runs with `npm start` (listen.js) instead.
import { httpServerHandler } from "cloudflare:node";
import { Pool } from "pg";
import { app } from "./app.js";
import db from "./db/connection.js";

const PORT = 8787;
app.listen(PORT);
const server = httpServerHandler({ port: PORT });

export default {
  async fetch(request, env, ctx) {
    const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
    const pool = new Pool({ connectionString, max: 1 });
    try {
      return await db.requestPool.run(pool, () => server.fetch(request, env, ctx));
    } finally {
      ctx.waitUntil(pool.end());
    }
  },
};
