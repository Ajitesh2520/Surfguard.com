import { randomUUID } from "node:crypto";
import type { EventCreateInput, EventRecord, EventStore } from "./event.store";

export function createMemoryEventStore(): EventStore {
  const events: EventRecord[] = [];

  return {
    async create(userId, input: EventCreateInput) {
      const now = new Date();
      const event: EventRecord = {
        id: randomUUID(),
        userId,
        focusSessionId: input.focusSessionId,
        url: input.url,
        domain: input.domain,
        title: input.title,
        tabId: input.tabId,
        occurredAt: input.occurredAt,
        createdAt: now,
      };
      events.unshift(event);
      return event;
    },

    async listByUser(userId, limit) {
      return events
        .filter((event) => event.userId === userId)
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, limit);
    },
  };
}
