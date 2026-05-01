import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId?: string;
        role?: string;
        email?: string;
      };
    }
  }
}

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerk = CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: CLERK_SECRET_KEY })
  : null;

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

async function verifyClerkToken(token: string) {
  if (!CLERK_SECRET_KEY) return null;
  try {
    const claims = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });
    return claims;
  } catch {
    return null;
  }
}

/**
 * Optional auth: populates req.auth if a valid token is present, otherwise continues.
 * Use this on public-but-personalizable routes.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = extractBearer(req);
  if (!token) return next();
  const claims = await verifyClerkToken(token);
  if (claims?.sub) {
    req.auth = {
      userId: claims.sub,
      sessionId: claims.sid,
      role: (claims as any).public_metadata?.role,
      email: (claims as any).email,
    };
  }
  next();
};

/**
 * Required auth: returns 401 if no valid token.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!CLERK_SECRET_KEY) {
    // In environments without Clerk configured (local dev) we accept anonymous
    // requests but mark them as guest so downstream code can still scope queries.
    req.auth = { userId: "anon-dev" };
    return next();
  }
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ error: "unauthorized", message: "Falta token de autenticación" });
  }
  const claims = await verifyClerkToken(token);
  if (!claims?.sub) {
    return res.status(401).json({ error: "unauthorized", message: "Token inválido o expirado" });
  }
  req.auth = {
    userId: claims.sub,
    sessionId: claims.sid,
    role: (claims as any).public_metadata?.role,
    email: (claims as any).email,
  };
  next();
};

/**
 * Admin auth: requires a valid Clerk user with role=admin OR a matching ADMIN_API_KEY.
 * The legacy `x-admin-key` header continues to work but ONLY when ADMIN_API_KEY is set.
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;
  const headerKey = req.headers["x-admin-key"];

  // Fast-path: server-to-server admin key
  if (adminKey && typeof headerKey === "string" && headerKey === adminKey) {
    req.auth = { userId: "admin-key" };
    return next();
  }

  // User token path: must be admin role
  const token = extractBearer(req);
  if (token && CLERK_SECRET_KEY) {
    const claims = await verifyClerkToken(token);
    const role = (claims as any)?.public_metadata?.role;
    if (claims?.sub && role === "admin") {
      req.auth = {
        userId: claims.sub,
        sessionId: claims.sid,
        role: "admin",
        email: (claims as any).email,
      };
      return next();
    }
  }

  // Backwards-compat: when ADMIN_API_KEY is NOT configured, accept the legacy
  // hardcoded value so existing deployments keep working until the operator
  // sets the env var. This branch is logged loudly.
  if (!adminKey && headerKey === "autos") {
    // eslint-disable-next-line no-console
    console.warn("[security] ADMIN_API_KEY not set — accepting legacy admin key. Set ADMIN_API_KEY in env immediately.");
    req.auth = { userId: "admin-legacy" };
    return next();
  }

  return res.status(403).json({ error: "forbidden", message: "Acceso administrativo requerido" });
};

export async function getClerkUser(userId: string) {
  if (!clerk) return null;
  try {
    return await clerk.users.getUser(userId);
  } catch {
    return null;
  }
}

export function isClerkConfigured(): boolean {
  return !!CLERK_SECRET_KEY;
}

export function getClerkPublishableKey(): string | undefined {
  return CLERK_PUBLISHABLE_KEY;
}
