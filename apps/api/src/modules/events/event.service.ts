import { decideWithContext } from "@surfguard/decision";
import {
  blockAllowsContinue,
  type InterventionPayload,
  type StoredBrowsingEvent,
} from "@surfguard/shared";
import { log } from "../../log";
import type { ClassificationPipeline } from "../classification/pipeline";
import type { GoalStore } from "../goals/goal.store";
import type { SessionStore } from "../sessions/session.store";
import { EventError } from "./event.errors";
import { toPublicEvent, type EventRecord, type EventStore } from "./event.store";
import { normalizeBrowsingUrl } from "./url";

export type IngestEventInput = {
  url: string;
  title?: string | null;
  timestamp?: string;
  tabId?: number;
};

export type IngestEventResult = {
  event: StoredBrowsingEvent;
  intervention: InterventionPayload | null;
};

export function createEventService(
  store: EventStore,
  sessionStore: SessionStore,
  goalStore?: GoalStore,
  pipeline?: ClassificationPipeline,
) {
  return {
    async ingest(
      userId: string,
      input: IngestEventInput,
    ): Promise<IngestEventResult> {
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

      let intervention: InterventionPayload | null = null;
      if (active && goalStore && pipeline) {
        try {
          intervention = await decideForEvent(
            store,
            pipeline,
            goalStore,
            userId,
            event,
            active.strictness,
            active.goalId,
          );
        } catch (error) {
          log("error", "classification_failed", {
            userId,
            domain: event.domain,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }

      return { event: toPublicEvent(event), intervention };
    },

    async list(userId: string) {
      const events = await store.listByUser(userId, 100);
      return events.map(toPublicEvent);
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;

async function decideForEvent(
  store: EventStore,
  pipeline: ClassificationPipeline,
  goalStore: GoalStore,
  userId: string,
  event: EventRecord,
  strictness: InterventionPayload["strictness"],
  goalId: string,
): Promise<InterventionPayload | null> {
  const goal = await goalStore.findByUserAndId(userId, goalId);
  if (!goal) return null;

  const recent = await store.listByUser(userId, 8);
  const chronological = [...recent].reverse();
  const recentContext = chronological
    .filter((item) => item.id !== event.id)
    .map((item) => [item.domain, item.title].filter(Boolean).join(" "));

  const pipelineResult = await pipeline.run({
    userId,
    eventId: event.id,
    url: event.url,
    domain: event.domain,
    title: event.title,
    goal,
    strictness,
    recentContext,
  });

  const previous = chronological.filter((item) => item.id !== event.id).at(-1);
  const timeSpentMs = previous
    ? Math.max(0, event.occurredAt.getTime() - previous.occurredAt.getTime())
    : 30_000;

  const decided = decideWithContext({
    domain: event.domain,
    goal: {
      title: goal.title,
      category: goal.category,
      topics: goal.topics,
      keywords: goal.keywords,
    },
    strictness,
    rule: pipelineResult.rule,
    classification: pipelineResult.ai,
    preferences: {},
    recentContext,
    timeSpentMs,
    drift: {
      offGoalStreak: 0,
      offGoalRatio: 0,
      repeatedOffGoalDomain: false,
    },
    activity: chronological.map((item) => ({
      domain: item.domain,
      title: item.title,
      occurredAt: item.occurredAt,
    })),
  });

  const canContinue =
    decided.decision !== "BLOCK" ||
    blockAllowsContinue(strictness, decided.source);

  log("info", "intervention_decided", {
    domain: event.domain,
    decision: decided.decision,
    source: decided.source,
  });

  return {
    decision: decided.decision,
    reason: decided.reason,
    goalTitle: goal.title,
    pageTitle: event.title,
    url: event.url,
    domain: event.domain,
    canContinue,
    strictness,
  };
}
