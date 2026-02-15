export async function getCategoryFromCache(domain: string): Promise<string | null> {
  const { categoryCache = {} } = await chrome.storage.local.get("categoryCache");
  return categoryCache[domain] ?? null;
}

export async function saveCategoryToCache(domain: string, category: string) {
  const { categoryCache = {} } = await chrome.storage.local.get("categoryCache");
  categoryCache[domain] = category;
  await chrome.storage.local.set({ categoryCache });
}

export async function saveDomainForCategory(domain: string, category: string) {
  const { categoryDomains = {} } = await chrome.storage.local.get("categoryDomains");

  categoryDomains[category] = categoryDomains[category] || [];

  if (!categoryDomains[category].includes(domain)) {
    categoryDomains[category].push(domain);
  }

  await chrome.storage.local.set({ categoryDomains });
}
