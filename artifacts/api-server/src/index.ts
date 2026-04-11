import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./lib/run-migrations";
import { autoSeedIfEmpty } from "./lib/startup-seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run schema migrations first, then seed if empty
  runMigrations()
    .then(() => autoSeedIfEmpty())
    .catch((e) => logger.error({ err: e }, "Startup error"));
});
