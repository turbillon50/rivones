import type { Request, Response, NextFunction, RequestHandler } from "express";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming) || nanoid(12);
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
};
