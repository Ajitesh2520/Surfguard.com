import type { NextFunction, Request, Response } from "express";
import {
  SESSION_STRICTNESS,
  type SessionStrictness,
} from "@surfguard/shared";
import { z } from "zod";
import { SessionError } from "./session.errors";

const strictnessSchema = z.enum(
  SESSION_STRICTNESS as unknown as [SessionStrictness, ...SessionStrictness[]],
);

export const startSessionSchema = z.object({
  goalId: z.string().trim().min(1, "Goal is required"),
  strictness: strictnessSchema.optional().default("BALANCED"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(180, "Duration must be at most 180 minutes"),
});

export function validateStartSession(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const parsed = startSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    next(SessionError.validation(message));
    return;
  }
  req.body = parsed.data;
  next();
}
