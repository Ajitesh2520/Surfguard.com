import type { RuleDecision, SessionStrictness } from "@surfguard/shared";

export type RuleGoalInput = {
  title?: string;
  category?: string;
  topics?: readonly string[];
  keywords?: readonly string[];
};

export type RulePreferences = {
  allowDomains?: readonly string[];
  blockDomains?: readonly string[];
};

export type RuleEngineInput = {
  url: string;
  domain: string;
  title: string | null;
  goal: RuleGoalInput;
  preferences: RulePreferences;
  strictness: SessionStrictness;
};

export type RuleResultSource = "user" | "catalog" | "custom" | "none";

export type RuleResult = {
  decision: RuleDecision;
  source: RuleResultSource;
  reason: string;
  matchedDomain: string | null;
};

export type RuleEvaluator = {
  id: string;
  evaluate(input: NormalizedRuleInput): RuleResult | null;
};

export type NormalizedRuleInput = RuleEngineInput & {
  host: string | null;
  validUrl: boolean;
};

export type RuleEngineOptions = {
  productiveDomains?: readonly string[];
  distractingDomains?: readonly string[];
  extraEvaluators?: readonly RuleEvaluator[];
};
