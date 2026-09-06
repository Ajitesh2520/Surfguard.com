import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { EventError } from "./event.errors";

export const ingestEventSchema = z.object({
  url: z.string().trim().min(1, "URL is required").max(2048),
  domain: z.string().trim().max(253).optional(),
  title: z.string().trim().max(500).nullable().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  tabId: z.number().int().nonnegative().optional(),
});

export function validateIngestEvent(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const parsed = ingestEventSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    next(EventError.validation(message));
    return;
  }
  req.body = parsed.data;
  next();
}
