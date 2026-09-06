import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AuthError } from "./auth.errors";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Valid email required")
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export function validateCredentials(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    next(AuthError.validation(message));
    return;
  }

  req.body = parsed.data;
  next();
}
