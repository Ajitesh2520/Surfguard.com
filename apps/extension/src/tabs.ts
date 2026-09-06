import type { BrowserActivityEvent } from "@surfguard/shared";
import { getDomainFromUrl } from "./domain";

export function toActivityEvent(
  tab: chrome.tabs.Tab,
): BrowserActivityEvent | null {
  if (typeof tab.id !== "number" || !tab.url) return null;

  const domain = getDomainFromUrl(tab.url);
  if (!domain) return null;

  const title = tab.title?.trim();

  return {
    url: tab.url,
    domain,
    title: title ? title : null,
    timestamp: new Date().toISOString(),
    tabId: tab.id,
  };
}

export async function captureTab(tabId: number): Promise<BrowserActivityEvent | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return toActivityEvent(tab);
  } catch {
    return null;
  }
}
