import type { AuthLoginResponse, BrowserActivityEvent } from "@surfguard/shared";
import { API_BASE_URL } from "./config";
import { getSessionToken } from "./auth";

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json()) as AuthLoginResponse | { error?: string };
  if (!response.ok || !("token" in body)) {
    throw new Error("error" in body && body.error ? body.error : "Login failed");
  }
  return body.token;
}

export async function postActivityEvent(
  event: BrowserActivityEvent,
): Promise<void> {
  const token = await getSessionToken();
  if (!token) return;

  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  });

  if (!response.ok && response.status !== 429) {
    throw new Error(`Event ingest failed (${response.status})`);
  }
}
