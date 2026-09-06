import { Router as createRouter } from "express";
import type { Router } from "express";
import { asyncHandler } from "../../async-handler";
import { AuthError } from "../auth/auth.errors";
import { requireAuth } from "../auth/auth.middleware";
import type { AuthService } from "../auth/auth.service";
import type { GoalService } from "./goal.service";
import { GoalError } from "./goal.errors";
import { validateCreateGoal, validateUpdateGoal } from "./goal.validation";
import type { GoalCreateInput, GoalUpdateInput } from "./goal.store";

function requirePrincipal(req: { auth?: { userId: string } }) {
  const principal = req.auth;
  if (!principal) {
    throw AuthError.unauthorized();
  }
  return principal;
}

export function createGoalRouter(
  authService: AuthService,
  goalService: GoalService,
): Router {
  const router = createRouter();
  const auth = requireAuth(authService);

  router.post(
    "/",
    auth,
    validateCreateGoal,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const goal = await goalService.create(
        principal.userId,
        req.body as GoalCreateInput,
      );
      res.status(201).json({ goal });
    }),
  );

  router.get(
    "/",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const goals = await goalService.list(principal.userId);
      res.json({ goals });
    }),
  );

  router.get(
    "/:id",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const id = req.params.id;
      if (!id) {
        throw GoalError.validation("Goal id is required");
      }
      const goal = await goalService.get(principal.userId, id);
      res.json({ goal });
    }),
  );

  router.patch(
    "/:id",
    auth,
    validateUpdateGoal,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const id = req.params.id;
      if (!id) {
        throw GoalError.validation("Goal id is required");
      }
      const goal = await goalService.update(
        principal.userId,
        id,
        req.body as GoalUpdateInput,
      );
      res.json({ goal });
    }),
  );

  router.delete(
    "/:id",
    auth,
    asyncHandler(async (req, res) => {
      const principal = requirePrincipal(req);
      const id = req.params.id;
      if (!id) {
        throw GoalError.validation("Goal id is required");
      }
      await goalService.remove(principal.userId, id);
      res.status(204).end();
    }),
  );

  return router;
}
