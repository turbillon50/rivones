// Vercel serverless adapter for the Express api-server.
// We import the already-configured Express app and re-export it as the
// default handler. Vercel's `@vercel/node` runtime treats an Express app
// as a `(req, res) => void` handler natively.
//
// Cold-start considerations:
// - Migrations and auto-seed run inside `index.ts`'s `app.listen` callback,
//   NOT in `app.ts`. Importing `app.ts` directly here keeps the cold path
//   light. Schema migrations should be run via a separate one-off command
//   (or against the long-running staging instance) rather than per-request.
import app from "../src/app";

export default app;
