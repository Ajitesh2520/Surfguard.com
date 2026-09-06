import type { BrowserActivityEvent } from "@surfguard/shared";
import { logActivityEvent, readActivityEvents } from "./activityLog";
import { postActivityEvent } from "./api";
import {
  isGetRecentActivityMessage,
  RECENT_ACTIVITY,
} from "./messages";
import { captureTab, toActivityEvent } from "./tabs";

chrome.runtime.onInstalled.addListener(() => {
  console.log("SurfGuard extension installed");
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void captureAndLog(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url && !changeInfo.title && changeInfo.status !== "complete") {
    return;
  }
  const event = toActivityEvent(tab);
  if (event) {
    void record(event);
    return;
  }
  void captureAndLog(tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isGetRecentActivityMessage(message)) return;

  void readActivityEvents().then((events) => {
    sendResponse({ type: RECENT_ACTIVITY, events });
  });

  return true;
});

async function captureAndLog(tabId: number) {
  const event = await captureTab(tabId);
  if (event) {
    await record(event);
  }
}

async function record(event: BrowserActivityEvent) {
  await logActivityEvent(event);
  try {
    await postActivityEvent(event);
  } catch (error) {
    console.error("SurfGuard failed to send event", error);
  }
}
