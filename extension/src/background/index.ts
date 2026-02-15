import { getCategoryFromCache, saveCategoryToCache } from "../utils/categoryCache";
import { isLimitExceeded, blockCategory } from "./enforcer";
import { saveDomainForCategory } from "../utils/categoryCache";




let currentSession: {
  tabId: number
  url: string
  startTime: number
  category: string
} | null = null;

/**
 * Utility: get current timestamp
 */
const now = () => Date.now();

/**
 * Utility: extract domain from URL
 */
const getDomain = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

/**
 * Save time spent for a category
 */
async function saveTimeSpent(category: string, durationMs: number) {
  const result = await chrome.storage.local.get("categoryUsage");
  const usage = result.categoryUsage || {};

  usage[category] = (usage[category] || 0) + durationMs;

  await chrome.storage.local.set({ categoryUsage: usage });
}

/**
 * End current session
 */
async function endSession() {
  if (!currentSession) return;

  const duration = Date.now() - currentSession.startTime;

  if (duration > 1000) {
    await saveTimeSpent(currentSession.category, duration);
  }

  const exceeded = await isLimitExceeded(currentSession.category);
  if (exceeded) {
    await blockCategory(currentSession.category);
  }

  currentSession = null;
}

/**
 * Start a new tracking session
 */
async function startSession(tabId: number, url: string) {
    
  const domain = getDomain(url);
  if (!domain) return;

//   // Get cached category or default
//   const { categoryCache = {} } = await chrome.storage.local.get("categoryCache");
//   const category = categoryCache[domain] || "Uncategorized";
const category = await resolveCategory(domain);

  currentSession = {
    tabId,
    url,
    startTime: now(),
    category
  };
}

async function resolveCategory(domain: string): Promise<string> {
  const cached = await getCategoryFromCache(domain);
  if (cached) return cached;

  const response = await fetch("http://localhost:4000/classify-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain })
  });

  const data = await response.json();
  const category = data.category || "Uncategorized";

  await saveCategoryToCache(domain, category);
await saveDomainForCategory(domain, category);

return category;
}

/**
 * Handle active tab change
 */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await endSession();

  const tab = await chrome.tabs.get(tabId);
  if (tab?.url && tab.active) {
    await startSession(tabId, tab.url);
  }
});

/**
 * Handle URL change within same tab
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.active || !changeInfo.url) return;

  await endSession();
  await startSession(tabId, changeInfo.url);
});

/**
 * Handle window focus change
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    await endSession();
  } else {
    // Browser regained focus
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab?.id && tab.url) {
      await startSession(tab.id, tab.url);
    }
  }
});

/**
 * Cleanup when tab is closed
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (currentSession?.tabId === tabId) {
    await endSession();
  }
});
