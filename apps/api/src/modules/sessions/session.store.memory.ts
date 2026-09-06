import { randomUUID } from "node:crypto";
import type {
  SessionCreateInput,
  SessionRecord,
  SessionStopInput,
  SessionStore,
} from "./session.store";

export function createMemorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionRecord>();

  return {
    async create(userId, input: SessionCreateInput) {
      const now = input.startTime;
      const session: SessionRecord = {
        id: randomUUID(),
        userId,
        goalId: input.goalId,
        strictness: input.strictness,
        status: "ACTIVE",
        startTime: now,
        endTime: null,
        durationMs: null,
        plannedDurationMinutes: input.plannedDurationMinutes,
        createdAt: now,
        updatedAt: now,
      };
      sessions.set(session.id, session);
      return session;
    },

    async listByUser(userId) {
      return Array.from(sessions.values())
        .filter((session) => session.userId === userId)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    },

    async findByUserAndId(userId, id) {
      const session = sessions.get(id);
      if (!session || session.userId !== userId) return null;
      return session;
    },

    async findActiveByUser(userId) {
      return (
        Array.from(sessions.values()).find(
          (session) => session.userId === userId && session.status === "ACTIVE",
        ) ?? null
      );
    },

    async stopByUserAndId(userId, id, input: SessionStopInput) {
      const session = sessions.get(id);
      if (!session || session.userId !== userId) return null;
      if (session.status !== "ACTIVE") return session;
      const updated: SessionRecord = {
        ...session,
        status: input.status,
        endTime: input.endTime,
        durationMs: input.durationMs,
        updatedAt: input.endTime,
      };
      sessions.set(id, updated);
      return updated;
    },
  };
}
