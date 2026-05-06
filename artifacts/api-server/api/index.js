// Vercel serverless adapter for the Express api-server.
//
// We import the prebuilt ESM bundle from dist/app.mjs (built by
// `node ./build.mjs` via the new src/app.ts entry point we added).
// This avoids the @vercel/node TypeScript pipeline entirely — it sees a
// .js file and just runs it. The express app is exported as the default
// handler; @vercel/node treats an Express app as a (req, res) => void
// handler natively.
//
// Why not import ../src/app.ts directly?
// - @vercel/node tries to typecheck the entire transitive graph and choked
//   on workspace package types. Pre-bundling with esbuild sidesteps that.
import app from "../dist/app.mjs";

export default app;
