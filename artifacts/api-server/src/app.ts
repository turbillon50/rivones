import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as pinoHttpModule from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requestId } from "./middleware/requestId";

const pinoHttp = (pinoHttpModule as any).default || pinoHttpModule;

const app: Express = express();

// Disable ETags — prevents 304 responses that break the client fetch layer
app.set("etag", false);
app.set("trust proxy", 1);

app.use(requestId);

app.use(
  pinoHttp({
    logger,
    genReqId: (req: any) => req.id,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Security headers — keep CSP off here because the API serves no HTML.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS — whitelist driven by env. CORS_ALLOWED_ORIGINS is comma-separated.
// CORS_ALLOWED_DOMAIN is the apex production domain; any subdomain is allowed.
// In dev (no env set) we allow everything to keep DX simple.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedDomain = process.env.CORS_ALLOWED_DOMAIN?.trim() || null;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server, curl, mobile apps
      if (allowedOrigins.length === 0 && !allowedDomain) return cb(null, true); // dev fallback
      if (allowedOrigins.includes(origin)) return cb(null, true);
      try {
        const u = new URL(origin);
        if (allowedDomain) {
          if (u.hostname === allowedDomain) return cb(null, true);
          if (u.hostname.endsWith(`.${allowedDomain}`)) return cb(null, true);
        }
        // Vercel preview deploys are always allowed so PRs can be tested.
        if (u.hostname.endsWith(".vercel.app")) return cb(null, true);
      } catch {}
      return cb(new Error(`origin_not_allowed:${origin}`));
    },
    credentials: true,
    exposedHeaders: ["x-request-id"],
  }),
);

// Stripe webhook MUST receive the raw body — mounted BEFORE express.json so the
// signature stays verifiable.
app.use("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Generic API rate limit (per-IP). Stricter limits live on individual routes.
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 240),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Demasiadas solicitudes, intenta en un momento" },
});

app.use("/api", apiLimiter as unknown as RequestHandler, router);

export default app;
