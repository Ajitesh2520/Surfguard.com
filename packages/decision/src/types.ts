import type { RuleResult } from "@surfguard/rules";
import type {
  AiClassification,
  InterventionDecision,
  SessionStrictness,
} from "@surfguard/shared";

export type DecisionGoalInput = {
  title?: string;
  category?: string;
  topics?: readonly string[];
  keywords?: readonly string[];
};

export type DecisionPreferences = {
  allowDomains?: readonly string[];
  blockDomains?: readonly string[];
};

export type DriftSignals = {
  offGoalStreak: number;
  offGoalRatio: number;
  repeatedOffGoalDomain: boolean;
};

export type DecisionEngineInput = {
  domain: string;
  goal: DecisionGoalInput;
  strictness: SessionStrictness;
  rule: RuleResult | null;
  classification: AiClassification | null;
  preferences: DecisionPreferences;
  recentContext: readonly string[];
  timeSpentMs: number;
  drift: DriftSignals;
};

export type DecisionSource =
  | "user"
  | "session"
  | "rule"
  | "context"
  | "ai"
  | "default";

export type DecisionResult = {
  decision: InterventionDecision;
  reason: string;
  source: DecisionSource;
};
