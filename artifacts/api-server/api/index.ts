import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../src/app";
import { logger } from "../src/lib/logger";
import { runMigrations } from "../src/lib/run-migrations";
import { autoSeedIfEmpty } from "../src/lib/startup-seed";

/**
 * Vercel Function entry point. The whole Express app runs as a single
 * serverless function; vercel.json rewrites every /api/* request to this file.
 *
 * Cold-start work (migrations, optional seeding) runs once per Lambda
 * instance via a memoised promise so concurrent first requests share the
 * same boot.
 */

let bootPromise: Promise<void> | null = null;

function boot(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      try {
        await runMigrations();
        if (process.env.AUTO_SEED === "1") {
          await autoSeedIfEmpty();
        }
      } catch (err) {
        logger.error({ err }, "Cold-start boot failed");
        // Reset so the next request retries instead of poisoning the instance.
        bootPromise = null;
        throw err;
      }
    })();
  }
  return bootPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await boot();
  } catch (err) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "boot_failed", message: "Database not ready" }));
    return;
  }
  return (app as any)(req, res);
}
