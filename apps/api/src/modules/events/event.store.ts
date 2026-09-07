import type { StoredBrowsingEvent } from "@surfguard/shared";

export type EventRecord = {
  id: string;
  userId: string;
  focusSessionId: string | null;
  url: string;
  domain: string;
  title: string | null;
  tabId: number | null;
  durationMs: number | null;
  driftScore: number | null;
  occurredAt: Date;
  createdAt: Date;
};

export type EventCreateInput = {
  focusSessionId: string | null;
  url: string;
  domain: string;
  title: string | null;
  tabId: number | null;
  occurredAt: Date;
};

export type EventStore = {
  create(userId: string, input: EventCreateInput): Promise<EventRecord>;
  listByUser(userId: string, limit: number): Promise<EventRecord[]>;
  listByUserSince(
    userId: string,
    since: Date,
    limit: number,
  ): Promise<EventRecord[]>;
  updateMetrics(
    id: string,
    input: { durationMs?: number; driftScore?: number },
  ): Promise<void>;
};

export function toPublicEvent(event: EventRecord): StoredBrowsingEvent {
  return {
    id: event.id,
    url: event.url,
    domain: event.domain,
    title: event.title,
    tabId: event.tabId,
    durationMs: event.durationMs ?? null,
    driftScore: event.driftScore ?? null,
    occurredAt: event.occurredAt.toISOString(),
    focusSessionId: event.focusSessionId,
  };
}
