// extension/src/background/enforcer.ts

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function getCategoryLimits() {
  const { categoryLimits = {} } = await chrome.storage.local.get("categoryLimits");
  return categoryLimits as Record<string, number>;
}


export async function getCategoryUsage() {
  const { categoryUsage = {} } = await chrome.storage.local.get("categoryUsage");
  return categoryUsage as Record<string, number>;
}

export async function isLimitExceeded(category: string): Promise<boolean> {
  const limits = await getCategoryLimits();
  const usage = await getCategoryUsage();

  if (!limits[category]) return false;
  return usage[category] >= limits[category];
}


export async function blockCategory(category: string) {
  const { categoryDomains = {} } = await chrome.storage.local.get("categoryDomains");
  const domains: string[] = (categoryDomains as Record<string, string[]>)[category] || [];

  if (!domains.length) return;

  const rules = domains.map((domain) => ({
    id: hashCode(domain),
    priority: 1,
    action: { type: "block" as const },
    condition: {
      urlFilter: domain,
      resourceTypes: ["main_frame" as const]
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  });

  await chrome.storage.local.set({
    blockedCategories: {
      ...((await chrome.storage.local.get("blockedCategories")).blockedCategories || {}),
      [category]: true
    }
  });
}


