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
        durationMs: null,
        driftScore: null,
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

    async listByUserSince(userId, since, limit) {
      return events
        .filter(
          (event) => event.userId === userId && event.occurredAt >= since,
        )
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, limit);
    },

    async updateMetrics(id, input) {
      const event = events.find((item) => item.id === id);
      if (!event) return;
      if (input.durationMs !== undefined) event.durationMs = input.durationMs;
      if (input.driftScore !== undefined) event.driftScore = input.driftScore;
    },
  };
}
