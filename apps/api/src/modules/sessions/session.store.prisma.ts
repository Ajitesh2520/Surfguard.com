import type { SessionStatus, SessionStrictness } from "@surfguard/shared";
import { prisma } from "../../infra/database";
import type { SessionRecord, SessionStore } from "./session.store";

function toRecord(session: {
  id: string;
  userId: string;
  goalId: string;
  strictness: SessionStrictness;
  status: SessionStatus;
  startTime: Date;
  endTime: Date | null;
  durationMs: number | null;
  plannedDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}): SessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    goalId: session.goalId,
    strictness: session.strictness,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    durationMs: session.durationMs,
    plannedDurationMinutes: session.plannedDurationMinutes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function createPrismaSessionStore(): SessionStore {
  return {
    async create(userId, input) {
      const session = await prisma.focusSession.create({
        data: {
          userId,
          goalId: input.goalId,
          strictness: input.strictness,
          status: "ACTIVE",
          startTime: input.startTime,
          plannedDurationMinutes: input.plannedDurationMinutes,
        },
      });
      return toRecord(session);
    },

    async listByUser(userId) {
      const sessions = await prisma.focusSession.findMany({
        where: { userId },
        orderBy: { startTime: "desc" },
      });
      return sessions.map(toRecord);
    },

    async findByUserAndId(userId, id) {
      const session = await prisma.focusSession.findFirst({
        where: { id, userId },
      });
      return session ? toRecord(session) : null;
    },

    async findActiveByUser(userId) {
      const session = await prisma.focusSession.findFirst({
        where: { userId, status: "ACTIVE" },
      });
      return session ? toRecord(session) : null;
    },

    async stopByUserAndId(userId, id, input) {
      const existing = await prisma.focusSession.findFirst({
        where: { id, userId },
      });
      if (!existing) return null;
      if (existing.status !== "ACTIVE") return toRecord(existing);

      const session = await prisma.focusSession.update({
        where: { id },
        data: {
          status: input.status,
          endTime: input.endTime,
          durationMs: input.durationMs,
        },
      });
      return toRecord(session);
    },
  };
}
