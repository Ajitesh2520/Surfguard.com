import { log } from "../../log";
import type { SessionStore } from "../sessions/session.store";
import { EventError } from "./event.errors";
import { toPublicEvent, type EventStore } from "./event.store";
import { normalizeBrowsingUrl } from "./url";

export type IngestEventInput = {
  url: string;
  title?: string | null;
  timestamp?: string;
  tabId?: number;
};

export function createEventService(
  store: EventStore,
  sessionStore: SessionStore,
) {
  return {
    async ingest(userId: string, input: IngestEventInput) {
      const normalized = normalizeBrowsingUrl(input.url);
      if (!normalized) {
        throw EventError.validation("Valid http(s) URL required");
      }

      const occurredAt = input.timestamp
        ? new Date(input.timestamp)
        : new Date();
      if (Number.isNaN(occurredAt.getTime())) {
        throw EventError.validation("Invalid timestamp");
      }

      const active = await sessionStore.findActiveByUser(userId);
      const focusSessionId = active?.id ?? null;

      if (!focusSessionId) {
        log("info", "event_without_active_session", { userId });
      }

      const event = await store.create(userId, {
        focusSessionId,
        url: normalized.url,
        domain: normalized.domain,
        title: input.title?.trim() ? input.title.trim() : null,
        tabId: input.tabId ?? null,
        occurredAt,
      });

      log("info", "event_ingested", {
        userId,
        domain: event.domain,
        focusSessionId: event.focusSessionId,
        tabId: event.tabId,
      });

      return toPublicEvent(event);
    },

    async list(userId: string) {
      const events = await store.listByUser(userId, 100);
      return events.map(toPublicEvent);
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
