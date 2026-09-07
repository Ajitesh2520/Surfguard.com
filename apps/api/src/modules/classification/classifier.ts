import type { AiClassification, AiDecision, GoalCategory } from "@surfguard/shared";

export type AiClassificationInput = {
  goal: string;
  goalCategory: GoalCategory;
  goalTopics: readonly string[];
  url: string;
  domain: string;
  pageTitle: string | null;
  recentContext: readonly string[];
};

export type AiClassifier = {
  classify(input: AiClassificationInput): Promise<AiClassification>;
};

export function fallbackClassification(
  input: AiClassificationInput,
  reason = "Classification unavailable",
): AiClassification {
  return {
    relevanceScore: 0.5,
    category: input.goalCategory,
    decision: "nudge",
    reason,
    confidence: 0,
  };
}

export function toStoredDecision(
  decision: AiDecision,
): "ALLOW" | "NUDGE" | "WARN" | "BLOCK" {
  return decision.toUpperCase() as "ALLOW" | "NUDGE" | "WARN" | "BLOCK";
}
