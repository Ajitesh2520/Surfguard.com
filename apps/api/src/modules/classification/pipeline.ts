import { evaluate as evaluateRules } from "@surfguard/rules";
import type { GoalCategory, SessionStrictness } from "@surfguard/shared";
import { log } from "../../log";
import type { GoalRecord } from "../goals/goal.store";
import type { AiClassifier } from "./classifier";
import { toStoredDecision } from "./classifier";
import type {
  ClassificationCacheStore,
  ClassificationStore,
  StoredClassification,
} from "./classification.store";

export type ClassificationPipelineInput = {
  userId: string;
  eventId: string;
  url: string;
  domain: string;
  title: string | null;
  goal: GoalRecord;
  strictness: SessionStrictness;
  recentContext: readonly string[];
};

export function createClassificationPipeline(options: {
  classifier: AiClassifier;
  cache: ClassificationCacheStore;
  classifications: ClassificationStore;
  evaluate?: typeof evaluateRules;
}) {
  const evaluate = options.evaluate ?? evaluateRules;

  return {
    async run(input: ClassificationPipelineInput): Promise<StoredClassification> {
      const cached = await options.cache.get(
        input.userId,
        input.goal.id,
        input.url,
      );
      if (cached) {
        const stored = {
          browsingEventId: input.eventId,
          decision: cached.decision,
          relevant: cached.relevant,
          relevanceScore: cached.relevanceScore,
          category: cached.category,
          confidence: cached.confidence,
          source: "CACHE" as const,
          reason: cached.reason,
        };
        await options.classifications.create(stored);
        log("info", "classification_cache_hit", {
          domain: input.domain,
          decision: stored.decision,
        });
        return stored;
      }

      const rule = evaluate({
        url: input.url,
        domain: input.domain,
        title: input.title,
        goal: {
          title: input.goal.title,
          category: input.goal.category,
          topics: input.goal.topics,
          keywords: input.goal.keywords,
        },
        preferences: {},
        strictness: input.strictness,
      });

      let stored: StoredClassification;

      if (rule.decision === "ALLOW" || rule.decision === "BLOCK") {
        stored = fromRule(input, rule.decision, rule.reason);
        log("info", "classification_rule", {
          domain: input.domain,
          decision: stored.decision,
          reason: rule.reason,
        });
      } else {
        log("info", "classification_ai_start", { domain: input.domain });
        const ai = await options.classifier.classify({
          goal: input.goal.title,
          goalCategory: input.goal.category,
          goalTopics: input.goal.topics,
          url: input.url,
          domain: input.domain,
          pageTitle: input.title,
          recentContext: input.recentContext,
        });
        stored = {
          browsingEventId: input.eventId,
          decision: toStoredDecision(ai.decision),
          relevant: ai.relevanceScore >= 0.5,
          relevanceScore: ai.relevanceScore,
          category: ai.category,
          confidence: ai.confidence,
          source: "AI",
          reason: ai.reason,
        };
        log("info", "classification_stored", {
          domain: input.domain,
          decision: stored.decision,
          source: "AI",
        });
      }

      await options.classifications.create(stored);
      await options.cache.set({
        userId: input.userId,
        goalId: input.goal.id,
        url: input.url,
        domain: input.domain,
        decision: stored.decision,
        category: stored.category,
        relevanceScore: stored.relevanceScore,
        relevant: stored.relevant,
        confidence: stored.confidence,
        reason: stored.reason,
        source: stored.source,
      });
      log("info", "classification_cached", {
        domain: input.domain,
        source: stored.source,
      });
      return stored;
    },
  };
}

export type ClassificationPipeline = ReturnType<
  typeof createClassificationPipeline
>;

function fromRule(
  input: ClassificationPipelineInput,
  decision: "ALLOW" | "BLOCK",
  reason: string,
): StoredClassification {
  const relevant = decision === "ALLOW";
  return {
    browsingEventId: input.eventId,
    decision,
    relevant,
    relevanceScore: relevant ? 1 : 0,
    category: input.goal.category as GoalCategory,
    confidence: 1,
    source: "RULE",
    reason,
  };
}
