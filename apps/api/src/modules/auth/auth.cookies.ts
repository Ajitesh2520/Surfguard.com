import type { CookieOptions, Request, Response } from "express";
import { getAuthConfig } from "./auth.config";

export function sessionCookieOptions(): CookieOptions {
  const config = getAuthConfig();
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    maxAge: config.sessionTtlMs,
  };
}

export function readSessionToken(req: Request): string | undefined {
  const value = req.cookies?.[getAuthConfig().cookieName];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(getAuthConfig().cookieName, token, sessionCookieOptions());
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(getAuthConfig().cookieName, {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}
