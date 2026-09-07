import { Router as createRouter } from "express";
import type { Router } from "express";
import { asyncHandler } from "../../async-handler";
import { createRateLimiter } from "../../middleware/rate-limit";
import { AuthError } from "../auth/auth.errors";
import { requireAuth } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.service";
import type { EventService } from "./event.service";
import { validateIngestEvent } from "./event.validation";
import type { IngestEventInput } from "./event.service";

function requirePrincipal(req: { auth?: { userId: string } }) {
  const principal = req.auth;
  if (!principal) {
    throw AuthError.unauthorized();
  }
  return principal;
}

export function createEventRouter(
  authService: AuthService,
  eventService: EventService,
): Router {
  const router = createRouter();
  const auth = requireAuth(authService);
  const limit = Number(process.env.EVENTS_RATE_LIMIT) || 60;
  const rateLimit = createRateLimiter({
    limit,
    windowMs: 60_000,
  });

  router.post(
    "/",
    auth,
    rateLimit,
    validateIngestEvent,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const result = await eventService.ingest(
        principal.userId,
        req.body as IngestEventInput,
      );
      res.status(201).json(result);
    }),
  );

  router.get(
    "/",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const events = await eventService.list(principal.userId);
      res.json({ events });
    }),
  );

  return router;
}
