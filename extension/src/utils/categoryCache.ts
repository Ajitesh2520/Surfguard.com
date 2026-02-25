export async function getCategoryFromCache(domain: string): Promise<string | null> {
  const { categoryCache = {} } = await chrome.storage.local.get("categoryCache");
  const cache = categoryCache as Record<string, string>;
  return cache[domain] ?? null;
}

export async function saveCategoryToCache(domain: string, category: string) {
  const { categoryCache = {} } = await chrome.storage.local.get("categoryCache");
  const cache = categoryCache as Record<string, string>;
  cache[domain] = category;
  await chrome.storage.local.set({ categoryCache: cache });
}

export async function saveDomainForCategory(domain: string, category: string) {
  const { categoryDomains = {} } = await chrome.storage.local.get("categoryDomains");
  const domains = categoryDomains as Record<string, string[]>;
  domains[category] = domains[category] || [];
  if (!domains[category].includes(domain)) {
    domains[category].push(domain);
  }
  await chrome.storage.local.set({ categoryDomains: domains });
}
