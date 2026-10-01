import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Render (and other PaaS hosts) send SIGTERM before stopping a container.
// We stop accepting new connections, finish in-flight requests, then close
// the database pool so no connections are left dangling.
const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutdown signal received — draining connections");

  server.close(async () => {
    try {
      await pool.end();
      logger.info("Database pool closed — shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error closing database pool");
      process.exit(1);
    }
  });

  // Safety valve: force-exit after 15 s if graceful drain takes too long.
  setTimeout(() => {
    logger.warn("Graceful shutdown timeout — forcing exit");
    process.exit(1);
  }, 15_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
