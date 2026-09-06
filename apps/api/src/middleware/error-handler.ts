import type { NextFunction, Request, Response } from "express";
import { isAuthError } from "../modules/auth/auth.errors";

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

  if (isAuthError(error)) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL" });
}
