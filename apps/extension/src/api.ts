import type { AuthLoginResponse, BrowserActivityEvent, InterventionPayload } from "@surfguard/shared";
import { API_BASE_URL } from "./config";
import { getSessionToken } from "./auth";

// Neon + classification often take 5–10s; aborting early drops every intervention.
const FETCH_MS = 15_000;

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
): Promise<InterventionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(FETCH_MS),
    });

    if (!response.ok) {
      console.warn("SurfGuard event rejected", response.status);
      return null;
    }

    const body = (await response.json()) as {
      intervention?: InterventionPayload | null;
    };
    return body.intervention ?? null;
  } catch (error) {
    console.warn("SurfGuard event request failed", error);
    return null;
  }
}
