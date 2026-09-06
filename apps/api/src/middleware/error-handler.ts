import { isHttpError } from "../http-error";
import { log } from "../log";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isHttpError(error)) {
    log("warn", "request_error", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }

  log("error", "unhandled_error", {
    message: error instanceof Error ? error.message : "unknown",
  });
  res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
}
