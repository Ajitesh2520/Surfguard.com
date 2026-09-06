import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import { clearSessionCookie, setSessionCookie } from "./auth.cookies";
import { AuthError } from "./auth.errors";
import { requireAuth } from "./auth.middleware";
import type { AuthService } from "./auth.service";
import { validateCredentials } from "./auth.validation";

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createAuthRouter(authService: AuthService): Router {
  const router = createRouter();
  const auth = requireAuth(authService);

  router.post(
    "/register",
    validateCredentials,
    asyncHandler(async (req, res) => {
      const user = await authService.register(
        req.body.email as string,
        req.body.password as string,
      );
      res.status(201).json({ user });
    }),
  );

  router.post(
    "/login",
    validateCredentials,
    asyncHandler(async (req, res) => {
      const { user, token } = await authService.login(
        req.body.email as string,
        req.body.password as string,
      );
      setSessionCookie(res, token);
      res.json({ user });
    }),
  );

  router.post(
    "/logout",
    auth,
    asyncHandler(async (req, res) => {
      const principal = req.auth;
      if (!principal) {
        throw AuthError.unauthorized();
      }
      await authService.logout(principal.sessionId);
      clearSessionCookie(res);
      res.status(204).end();
    }),
  );

  router.get(
    "/me",
    auth,
    asyncHandler(async (req, res) => {
      const principal = req.auth;
      if (!principal) {
        throw AuthError.unauthorized();
      }
      const user = await authService.me(principal.userId);
      res.json({ user });
    }),
  );

  return router;
}
