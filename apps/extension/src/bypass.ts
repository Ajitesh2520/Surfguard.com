const BYPASS_KEY = "surfguardBypass";
const BYPASS_MS = 2 * 60 * 1000;

type BypassMap = Record<string, number>;

export async function allowBypass(url: string): Promise<void> {
  const current = await readBypass();
  current[url] = Date.now() + BYPASS_MS;
  await chrome.storage.session.set({ [BYPASS_KEY]: current });
}

export async function hasBypass(url: string): Promise<boolean> {
  const current = await readBypass();
  const expires = current[url];
  return typeof expires === "number" && expires > Date.now();
}

async function readBypass(): Promise<BypassMap> {
  try {
    const result = await chrome.storage.session.get(BYPASS_KEY);
    const value = result[BYPASS_KEY];
    return value && typeof value === "object" ? (value as BypassMap) : {};
  } catch {
    return {};
  }
}
