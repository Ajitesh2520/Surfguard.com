import { SESSION_TOKEN_KEY } from "./config";

export async function getSessionToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(SESSION_TOKEN_KEY);
  const token = result[SESSION_TOKEN_KEY];
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function setSessionToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [SESSION_TOKEN_KEY]: token });
}

export async function clearSessionToken(): Promise<void> {
  await chrome.storage.local.remove(SESSION_TOKEN_KEY);
}
