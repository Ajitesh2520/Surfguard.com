import { Router as createRouter } from "express";
import type { Router } from "express";
import { asyncHandler } from "../../async-handler";
import { AuthError } from "../auth/auth.errors";
import { requireAuth } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.service";
import type { SessionService } from "./session.service";
import { SessionError } from "./session.errors";
import { validateStartSession } from "./session.validation";

function requirePrincipal(req: { auth?: { userId: string } }) {
  const principal = req.auth;
  if (!principal) {
    throw AuthError.unauthorized();
  }
  return principal;
}

export function createSessionRouter(
  authService: AuthService,
  sessionService: SessionService,
): Router {
  const router = createRouter();
  const auth = requireAuth(authService);

  router.post(
    "/",
    auth,
    validateStartSession,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const body = req.body as {
        goalId: string;
        strictness: "RELAXED" | "BALANCED" | "STRICT";
        durationMinutes: number;
      };
      const session = await sessionService.start(principal.userId, {
        goalId: body.goalId,
        strictness: body.strictness,
        plannedDurationMinutes: body.durationMinutes,
      });
      res.status(201).json({ session });
    }),
  );

  router.get(
    "/",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const sessions = await sessionService.list(principal.userId);
      res.json({ sessions });
    }),
  );

  router.get(
    "/:id",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const id = req.params.id;
      if (!id) {
        throw SessionError.validation("Session id is required");
      }
      const session = await sessionService.get(principal.userId, id);
      res.json({ session });
    }),
  );

  router.post(
    "/:id/stop",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const id = req.params.id;
      if (!id) {
        throw SessionError.validation("Session id is required");
      }
      const session = await sessionService.stop(principal.userId, id);
      res.json({ session });
    }),
  );

  return router;
}
