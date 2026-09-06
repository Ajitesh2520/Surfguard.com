import type { NextFunction, Request, Response } from "express";
import { AuthError } from "./auth.errors";
import { readSessionToken } from "./auth.cookies";
import type { AuthService } from "./auth.service";

export function requireAuth(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = readSessionToken(req);
      if (!token) {
        throw AuthError.unauthorized();
      }

      req.auth = await authService.resolveSession(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
