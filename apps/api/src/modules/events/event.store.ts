import type { StoredBrowsingEvent } from "@surfguard/shared";

export type EventRecord = {
  id: string;
  userId: string;
  focusSessionId: string | null;
  url: string;
  domain: string;
  title: string | null;
  tabId: number | null;
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
};

export function toPublicEvent(event: EventRecord): StoredBrowsingEvent {
  return {
    id: event.id,
    url: event.url,
    domain: event.domain,
    title: event.title,
    tabId: event.tabId,
    occurredAt: event.occurredAt.toISOString(),
    focusSessionId: event.focusSessionId,
  };
}
