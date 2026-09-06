import type { PublicUser } from "@surfguard/shared";
import { getAuthConfig } from "./auth.config";
import { AuthError } from "./auth.errors";
import { hashPassword, verifyPassword } from "./password";
import type { AuthStore } from "./auth.store";
import { generateSessionToken, hashToken } from "./token";

export type AuthPrincipal = {
  userId: string;
  email: string;
  sessionId: string;
};

function toPublicUser(user: { id: string; email: string }): PublicUser {
  return { id: user.id, email: user.email };
}

export function createAuthService(store: AuthStore) {
  return {
    async register(email: string, password: string): Promise<PublicUser> {
      const passwordHash = await hashPassword(password);
      const user = await store.createUser(email, passwordHash);
      return toPublicUser(user);
    },

    async login(
      email: string,
      password: string,
    ): Promise<{ user: PublicUser; token: string }> {
      const user = await store.findUserByEmail(email);
      if (!user) {
        throw AuthError.invalidCredentials();
      }

      const matches = await verifyPassword(password, user.passwordHash);
      if (!matches) {
        throw AuthError.invalidCredentials();
      }

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + getAuthConfig().sessionTtlMs);
      await store.createSession(user.id, hashToken(token), expiresAt);
      return { user: toPublicUser(user), token };
    },

    async resolveSession(token: string): Promise<AuthPrincipal> {
      const session = await store.findSessionByTokenHash(hashToken(token));
      if (!session || session.expiresAt <= new Date()) {
        if (session) {
          await store.deleteSessionById(session.id);
        }
        throw AuthError.unauthorized();
      }

      return {
        userId: session.user.id,
        email: session.user.email,
        sessionId: session.id,
      };
    },

    async logout(sessionId: string): Promise<void> {
      await store.deleteSessionById(sessionId);
    },

    async me(userId: string): Promise<PublicUser> {
      const user = await store.findUserById(userId);
      if (!user) {
        throw AuthError.unauthorized();
      }
      return toPublicUser(user);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
