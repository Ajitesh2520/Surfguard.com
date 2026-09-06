export type HealthResponse = {
  status: "ok";
  service: string;
};

export type PublicUser = {
  id: string;
  email: string;
};

export type AuthUserResponse = {
  user: PublicUser;
};

export type AuthLoginResponse = {
  user: PublicUser;
  token: string;
};

export type AuthErrorBody = {
  error: string;
  code: string;
};

export const GOAL_CATEGORIES = [
  "STUDY",
  "CODING",
  "INTERVIEW_PREP",
  "RESEARCH",
  "WORK",
  "WRITING",
  "READING",
  "ENTERTAINMENT",
  "GENERAL",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  topics: string[];
  keywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GoalResponse = {
  goal: Goal;
};

export type GoalListResponse = {
  goals: Goal[];
};

export const SESSION_STRICTNESS = ["RELAXED", "BALANCED", "STRICT"] as const;
export type SessionStrictness = (typeof SESSION_STRICTNESS)[number];

export const SESSION_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type FocusSession = {
  id: string;
  goalId: string;
  strictness: SessionStrictness;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  plannedDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type FocusSessionResponse = {
  session: FocusSession;
};

export type FocusSessionListResponse = {
  sessions: FocusSession[];
};

export type BrowserActivityEvent = {
  url: string;
  domain: string;
  title: string | null;
  timestamp: string;
  tabId: number;
};

export type StoredBrowsingEvent = {
  id: string;
  url: string;
  domain: string;
  title: string | null;
  tabId: number | null;
  occurredAt: string;
  focusSessionId: string | null;
};

export type BrowsingEventResponse = {
  event: StoredBrowsingEvent;
};

export type BrowsingEventListResponse = {
  events: StoredBrowsingEvent[];
};
