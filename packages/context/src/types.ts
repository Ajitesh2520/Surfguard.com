import type { ContextAnalysis, DriftPattern } from "@surfguard/shared";

export type ContextActivity = {
  domain: string;
  title?: string | null;
  occurredAt: string | Date;
  durationMs?: number;
  relevant?: boolean | null;
};

export type ContextGoal = {
  title?: string;
  category?: string;
  topics?: readonly string[];
  keywords?: readonly string[];
};

export type ContextPreferences = {
  allowDomains?: readonly string[];
  blockDomains?: readonly string[];
};

export type ContextEngineInput = {
  activity: readonly ContextActivity[];
  goal?: ContextGoal;
  preferences?: ContextPreferences;
};

export type PageKind = "relevant" | "irrelevant" | "neutral";

export type ContextSignals = {
  offGoalStreak: number;
  offGoalRatio: number;
  repeatedOffGoalDomain: boolean;
  rapidSwitching: boolean;
  increasingDistractionTime: boolean;
  returnedToProductive: boolean;
  sustainedProductive: boolean;
};

export type ContextEngineResult = ContextAnalysis & {
  signals: ContextSignals;
};

export const SOFT_DISTRACTION_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "twitch.tv",
] as const;

export type { ContextAnalysis, DriftPattern };
