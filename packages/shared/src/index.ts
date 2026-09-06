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
