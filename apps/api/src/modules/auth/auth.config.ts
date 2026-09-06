export function getAuthConfig() {
  return {
    cookieName: process.env.AUTH_COOKIE_NAME ?? "surfguard_session",
    cookieSecure: process.env.COOKIE_SECURE === "true",
    sessionTtlMs:
      Number(process.env.SESSION_TTL_MS) || 7 * 24 * 60 * 60 * 1000,
    bcryptCost: Number(process.env.BCRYPT_COST) || 12,
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  };
}
