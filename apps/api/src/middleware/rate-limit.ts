import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-error";
import { log } from "../log";

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function rateLimit(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    const key = req.auth?.userId ?? req.ip ?? "anonymous";
    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.limit) {
      log("warn", "rate_limited", { key, count: current.count });
      next(
        new HttpError(
          429,
          "RATE_LIMITED",
          "Too many events; try again shortly",
        ),
      );
      return;
    }

    next();
  };
}
