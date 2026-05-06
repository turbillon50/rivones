// Vercel serverless adapter for the Express api-server.
// We import the already-configured Express app and re-export it as the
// default handler. Vercel's `@vercel/node` runtime treats an Express app
// as a `(req, res) => void` handler natively.
//
// The .js extension is required by the project's tsconfig
// (moduleResolution: nodenext) — TypeScript types resolve from app.ts.
import app from "../src/app.js";

export default app;
