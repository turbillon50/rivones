import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon (and Vercel Postgres) require TLS. The pooled-connection hostname
// (`*-pooler.*.neon.tech`) is preferred for serverless workloads — it reuses
// connections via PgBouncer so each Lambda cold-start doesn't open a new
// session.
const url = new URL(process.env.DATABASE_URL);
const sslRequired =
  url.searchParams.get("sslmode") === "require"
  || url.hostname.includes(".neon.tech")
  || url.hostname.endsWith(".vercel-storage.com")
  || url.hostname.endsWith(".aws.neon.tech");

// In serverless/Lambda runtimes we want a small pool to avoid leaking
// connections per cold-start invocation. In long-running servers we let the
// default kick in.
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 5_000 : 30_000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
