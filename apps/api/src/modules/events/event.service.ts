import { log } from "../../log";
import type { ClassificationPipeline } from "../classification/pipeline";
import type { GoalStore } from "../goals/goal.store";
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
  goalStore?: GoalStore,
  pipeline?: ClassificationPipeline,
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

      if (active && goalStore && pipeline) {
        try {
          const goal = await goalStore.findByUserAndId(userId, active.goalId);
          if (goal) {
            const recent = (await store.listByUser(userId, 6))
              .filter((item) => item.id !== event.id)
              .map((item) =>
                [item.domain, item.title].filter(Boolean).join(" "),
              );
            await pipeline.run({
              userId,
              eventId: event.id,
              url: event.url,
              domain: event.domain,
              title: event.title,
              goal,
              strictness: active.strictness,
              recentContext: recent,
            });
          }
        } catch (error) {
          log("error", "classification_failed", {
            userId,
            domain: event.domain,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }

      return toPublicEvent(event);
    },

    async list(userId: string) {
      const events = await store.listByUser(userId, 100);
      return events.map(toPublicEvent);
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
