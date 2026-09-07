import { Router as createRouter } from "express";
import type { Router } from "express";
import { asyncHandler } from "../../async-handler";
import { AuthError } from "../auth/auth.errors";
import { requireAuth } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.service";
import { HttpError } from "../../http-error";
import type { AnalyticsService } from "./analytics.service";
import { parseAnalyticsDays } from "./analytics.service";

function requirePrincipal(req: { auth?: { userId: string } }) {
  const principal = req.auth;
  if (!principal) {
    throw AuthError.unauthorized();
  }
  return principal;
}

export function createAnalyticsRouter(
  authService: AuthService,
  analyticsService: AnalyticsService,
): Router {
  const router = createRouter();
  const auth = requireAuth(authService);

  router.get(
    "/",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const days = parseAnalyticsDays(req.query.days);
      if (days < 1) {
        throw new HttpError(400, "VALIDATION_ERROR", "days must be 1–90");
      }
      const analytics = await analyticsService.get(principal.userId, days);
      res.json(analytics);
    }),
  );

  return router;
}
