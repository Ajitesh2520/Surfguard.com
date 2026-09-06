import type { BrowserActivityEvent } from "@surfguard/shared";

const STORAGE_KEY = "activityEvents";
const MAX_EVENTS = 50;

export async function readActivityEvents(): Promise<BrowserActivityEvent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const events = result[STORAGE_KEY];
  return Array.isArray(events) ? (events as BrowserActivityEvent[]) : [];
}

export async function logActivityEvent(
  event: BrowserActivityEvent,
): Promise<void> {
  console.log("SurfGuard activity", event);

  const events = await readActivityEvents();
  const last = events[0];
  if (
    last &&
    last.tabId === event.tabId &&
    last.url === event.url
  ) {
    events[0] = event;
  } else {
    events.unshift(event);
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: events.slice(0, MAX_EVENTS),
  });
}
