import type { BrowserActivityEvent, InterventionPayload } from "@surfguard/shared";
import { logActivityEvent, readActivityEvents } from "./activityLog";
import { postActivityEvent } from "./api";
import { allowBypass, hasBypass } from "./bypass";
import {
  SHOW_INTERVENTION,
  isContinueMessage,
  isGoBackMessage,
} from "./intervention";
import {
  isGetRecentActivityMessage,
  RECENT_ACTIVITY,
} from "./messages";
import { captureTab, toActivityEvent } from "./tabs";

const lastApplied = new Map<number, { url: string; at: number }>();

chrome.runtime.onInstalled.addListener(() => {
  console.log("SurfGuard extension installed");
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void captureAndLog(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url?.startsWith(chrome.runtime.getURL("blocked.html"))) return;
  if (!changeInfo.url && changeInfo.status !== "complete") return;
  const event = toActivityEvent(tab);
  if (event) {
    void record(event);
    return;
  }
  if (changeInfo.url) void captureAndLog(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isGetRecentActivityMessage(message)) {
    void readActivityEvents().then((events) => {
      sendResponse({ type: RECENT_ACTIVITY, events });
    });
    return true;
  }

  if (isGoBackMessage(message)) {
    const tabId = sender.tab?.id;
    if (typeof tabId === "number") {
      chrome.tabs.goBack(tabId, () => {
        if (chrome.runtime.lastError) {
          void chrome.tabs.update(tabId, { url: "about:blank" });
        }
      });
    }
    return;
  }

  if (isContinueMessage(message)) {
    const tabId = sender.tab?.id;
    void (async () => {
      await allowBypass(message.url);
      if (message.navigate && typeof tabId === "number") {
        await chrome.tabs.update(tabId, { url: message.url });
      }
    })();
  }
});

async function captureAndLog(tabId: number) {
  const event = await captureTab(tabId);
  if (event) await record(event);
}

async function record(event: BrowserActivityEvent) {
  try {
    await logActivityEvent(event);
  } catch {
    return;
  }

  let intervention: InterventionPayload | null = null;
  try {
    intervention = await postActivityEvent(event);
  } catch {
    return;
  }

  if (!intervention || intervention.decision === "ALLOW") return;
  if (await hasBypass(event.url)) return;

  const previous = lastApplied.get(event.tabId);
  if (
    previous &&
    previous.url === event.url &&
    Date.now() - previous.at < 8_000
  ) {
    return;
  }

  try {
    const applied = await applyIntervention(event.tabId, intervention);
    if (applied) {
      lastApplied.set(event.tabId, { url: event.url, at: Date.now() });
    }
  } catch (error) {
    // Fail open: never interrupt browsing if UI cannot be shown.
    console.warn("SurfGuard intervention failed", error);
  }
}

async function applyIntervention(
  tabId: number,
  intervention: InterventionPayload,
): Promise<boolean> {
  if (intervention.decision === "BLOCK") {
    await chrome.storage.session.set({ [`block:${tabId}`]: intervention });
    const blocked = chrome.runtime.getURL(
      `blocked.html?tab=${encodeURIComponent(String(tabId))}`,
    );
    await chrome.tabs.update(tabId, { url: blocked });
    return true;
  }

  // Content script may not be ready on the first navigation event; retry once.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: SHOW_INTERVENTION,
        intervention,
      });
      return true;
    } catch {
      if (attempt === 0) {
        await delay(400);
      }
    }
  }

  console.warn("SurfGuard content script missing; refresh the tab", {
    tabId,
    decision: intervention.decision,
  });
  return false;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
