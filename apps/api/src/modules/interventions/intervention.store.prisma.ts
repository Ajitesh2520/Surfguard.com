import { prisma } from "../../infra/database";
import type { InterventionStore } from "./intervention.store";

export function createPrismaInterventionStore(): InterventionStore {
  return {
    async create(input) {
      const row = await prisma.intervention.create({
        data: {
          userId: input.userId,
          focusSessionId: input.focusSessionId,
          browsingEventId: input.browsingEventId,
          kind: input.kind,
          message: input.message,
        },
        include: {
          browsingEvent: { select: { domain: true } },
          focusSession: { select: { goal: { select: { title: true } } } },
        },
      });
      return {
        id: row.id,
        userId: row.userId,
        focusSessionId: row.focusSessionId,
        browsingEventId: row.browsingEventId,
        kind: row.kind,
        message: row.message,
        createdAt: row.createdAt,
        domain: row.browsingEvent?.domain ?? input.domain ?? null,
        goalTitle: row.focusSession?.goal.title ?? input.goalTitle ?? null,
      };
    },

    async listByUserSince(userId, since, limit) {
      const rows = await prisma.intervention.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          browsingEvent: { select: { domain: true } },
          focusSession: { select: { goal: { select: { title: true } } } },
        },
      });
      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        focusSessionId: row.focusSessionId,
        browsingEventId: row.browsingEventId,
        kind: row.kind,
        message: row.message,
        createdAt: row.createdAt,
        domain: row.browsingEvent?.domain ?? null,
        goalTitle: row.focusSession?.goal.title ?? null,
      }));
    },
  };
}
