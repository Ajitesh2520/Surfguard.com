import { randomUUID } from "node:crypto";
import { AuthError } from "./auth.errors";
import type {
  AuthSessionRecord,
  AuthSessionWithUser,
  AuthStore,
  AuthUserRecord,
} from "./auth.store";

export function createMemoryAuthStore(): AuthStore {
  const users = new Map<string, AuthUserRecord>();
  const usersByEmail = new Map<string, string>();
  const sessions = new Map<string, AuthSessionRecord>();
  const sessionsByHash = new Map<string, string>();

  return {
    async findUserByEmail(email) {
      const id = usersByEmail.get(email);
      return id ? (users.get(id) ?? null) : null;
    },

    async findUserById(id) {
      return users.get(id) ?? null;
    },

    async createUser(email, passwordHash) {
      if (usersByEmail.has(email)) {
        throw AuthError.emailTaken();
      }

      const now = new Date();
      const user: AuthUserRecord = {
        id: randomUUID(),
        email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      users.set(user.id, user);
      usersByEmail.set(email, user.id);
      return user;
    },

    async createSession(userId, tokenHash, expiresAt) {
      const session: AuthSessionRecord = {
        id: randomUUID(),
        userId,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      };
      sessions.set(session.id, session);
      sessionsByHash.set(tokenHash, session.id);
      return session;
    },

    async findSessionByTokenHash(tokenHash) {
      const id = sessionsByHash.get(tokenHash);
      if (!id) return null;
      const session = sessions.get(id);
      if (!session) return null;
      const user = users.get(session.userId);
      if (!user) return null;
      const withUser: AuthSessionWithUser = { ...session, user };
      return withUser;
    },

    async deleteSessionById(id) {
      const session = sessions.get(id);
      if (!session) return;
      sessions.delete(id);
      sessionsByHash.delete(session.tokenHash);
    },
  };
}
