import type { ContextActivity } from "@surfguard/context";
import { analyzeContext } from "@surfguard/context";
import type { RuleResult } from "@surfguard/rules";
import type {
  AiClassification,
  ContextAnalysis,
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
  rapidSwitching?: boolean;
  increasingDistractionTime?: boolean;
  returnedToProductive?: boolean;
  sustainedProductive?: boolean;
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
  context?: ContextAnalysis;
  activity?: readonly ContextActivity[];
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

export function driftFromContext(analysis: {
  signals: DriftSignals;
}): DriftSignals {
  return { ...analysis.signals };
}

export function analyzeDecisionContext(
  input: Pick<DecisionEngineInput, "activity" | "goal" | "preferences">,
) {
  return analyzeContext({
    activity: input.activity ?? [],
    goal: input.goal,
    preferences: input.preferences,
  });
}
