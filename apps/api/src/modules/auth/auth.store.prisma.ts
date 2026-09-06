import { Prisma } from "@prisma/client";
import { prisma } from "../../infra/database";
import { AuthError } from "./auth.errors";
import type { AuthStore, AuthUserRecord } from "./auth.store";

function toUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createPrismaAuthStore(): AuthStore {
  return {
    async findUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? toUser(user) : null;
    },

    async findUserById(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toUser(user) : null;
    },

    async createUser(email, passwordHash) {
      try {
        const user = await prisma.user.create({
          data: { email, passwordHash },
        });
        return toUser(user);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw AuthError.emailTaken();
        }
        throw error;
      }
    },

    async createSession(userId, tokenHash, expiresAt) {
      return prisma.authSession.create({
        data: { userId, tokenHash, expiresAt },
      });
    },

    async findSessionByTokenHash(tokenHash) {
      const session = await prisma.authSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (!session) return null;
      return {
        id: session.id,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        user: toUser(session.user),
      };
    },

    async deleteSessionById(id) {
      await prisma.authSession.deleteMany({ where: { id } });
    },
  };
}
