import { prisma } from "../../infra/database";
import type { EventRecord, EventStore } from "./event.store";

function toRecord(event: {
  id: string;
  userId: string;
  focusSessionId: string | null;
  url: string;
  domain: string;
  title: string | null;
  tabId: number | null;
  occurredAt: Date;
  createdAt: Date;
}): EventRecord {
  return {
    id: event.id,
    userId: event.userId,
    focusSessionId: event.focusSessionId,
    url: event.url,
    domain: event.domain,
    title: event.title,
    tabId: event.tabId,
    occurredAt: event.occurredAt,
    createdAt: event.createdAt,
  };
}

export function createPrismaEventStore(): EventStore {
  return {
    async create(userId, input) {
      const event = await prisma.browsingEvent.create({
        data: {
          userId,
          focusSessionId: input.focusSessionId,
          url: input.url,
          domain: input.domain,
          title: input.title,
          tabId: input.tabId,
          occurredAt: input.occurredAt,
        },
      });
      return toRecord(event);
    },

    async listByUser(userId, limit) {
      const events = await prisma.browsingEvent.findMany({
        where: { userId },
        orderBy: { occurredAt: "desc" },
        take: limit,
      });
      return events.map(toRecord);
    },
  };
}
