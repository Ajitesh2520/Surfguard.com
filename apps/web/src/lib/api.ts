import type {
  AuthErrorBody,
  AuthUserResponse,
  BrowsingEventListResponse,
  FocusSession,
  FocusSessionListResponse,
  FocusSessionResponse,
  Goal,
  GoalListResponse,
  GoalResponse,
  PublicUser,
} from "@surfguard/shared";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as T | AuthErrorBody;

  if (!response.ok) {
    const error = body as AuthErrorBody;
    throw new Error(error.error ?? "Request failed");
  }

  return body as T;
}

export function fetchMe(): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/me");
}

export function register(
  email: string,
  password: string,
): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(
  email: string,
  password: string,
): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export function fetchGoals(): Promise<GoalListResponse> {
  return request<GoalListResponse>("/api/goals");
}

export function fetchGoal(id: string): Promise<GoalResponse> {
  return request<GoalResponse>(`/api/goals/${id}`);
}

export function createGoal(body: unknown): Promise<GoalResponse> {
  return request<GoalResponse>("/api/goals", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateGoal(id: string, body: unknown): Promise<GoalResponse> {
  return request<GoalResponse>(`/api/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteGoal(id: string): Promise<void> {
  return request<void>(`/api/goals/${id}`, { method: "DELETE" });
}

export function fetchSessions(): Promise<FocusSessionListResponse> {
  return request<FocusSessionListResponse>("/api/sessions");
}

export function fetchSession(id: string): Promise<FocusSessionResponse> {
  return request<FocusSessionResponse>(`/api/sessions/${id}`);
}

export function startSession(body: {
  goalId: string;
  durationMinutes: number;
  strictness: string;
}): Promise<FocusSessionResponse> {
  return request<FocusSessionResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function stopSession(id: string): Promise<FocusSessionResponse> {
  return request<FocusSessionResponse>(`/api/sessions/${id}/stop`, {
    method: "POST",
  });
}

export function fetchEvents(): Promise<BrowsingEventListResponse> {
  return request<BrowsingEventListResponse>("/api/events");
}

export type { FocusSession, Goal, PublicUser };
