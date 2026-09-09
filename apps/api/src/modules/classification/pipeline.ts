import { evaluate as evaluateRules, type RuleResult } from "@surfguard/rules";
import type { AiClassification, GoalCategory, SessionStrictness } from "@surfguard/shared";
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

export type PipelineResult = {
  classification: StoredClassification;
  rule: RuleResult;
  ai: AiClassification | null;
};

export function createClassificationPipeline(options: {
  classifier: AiClassifier;
  cache: ClassificationCacheStore;
  classifications: ClassificationStore;
  evaluate?: typeof evaluateRules;
}) {
  const evaluate = options.evaluate ?? evaluateRules;

  return {
    async run(input: ClassificationPipelineInput): Promise<PipelineResult> {
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

      const cached = await options.cache.get(
        input.userId,
        input.goal.id,
        input.url,
      );
      if (cached) {
        const classification: StoredClassification = {
          browsingEventId: input.eventId,
          decision: cached.decision,
          relevant: cached.relevant,
          relevanceScore: cached.relevanceScore,
          category: cached.category,
          confidence: cached.confidence,
          source: "CACHE",
          reason: cached.reason,
        };
        await options.classifications.create(classification);
        log("info", "classification_cache_hit", {
          domain: input.domain,
          category: classification.category,
          decision: classification.decision,
        });
        return {
          classification,
          rule,
          ai: cached.source === "AI" ? toAiClassification(cached) : null,
        };
      }

      let classification: StoredClassification;
      let ai: AiClassification | null = null;

      if (rule.decision === "ALLOW" || rule.decision === "BLOCK") {
        classification = fromRule(input, rule.decision, rule.reason);
        log("info", "classification_rule", {
          domain: input.domain,
          category: classification.category,
          decision: classification.decision,
          reason: rule.reason,
        });
      } else {
        log("info", "classification_ai_start", { domain: input.domain });
        ai = await options.classifier.classify({
          goal: input.goal.title,
          goalCategory: input.goal.category,
          goalTopics: input.goal.topics,
          url: input.url,
          domain: input.domain,
          pageTitle: input.title,
          recentContext: input.recentContext,
        });
        classification = {
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
          category: classification.category,
          decision: classification.decision,
          source: "AI",
        });
      }

      await options.classifications.create(classification);
      await options.cache.set({
        userId: input.userId,
        goalId: input.goal.id,
        url: input.url,
        domain: input.domain,
        decision: classification.decision,
        category: classification.category,
        relevanceScore: classification.relevanceScore,
        relevant: classification.relevant,
        confidence: classification.confidence,
        reason: classification.reason,
        source: classification.source,
      });
      log("info", "classification_cached", {
        domain: input.domain,
        category: classification.category,
        decision: classification.decision,
        source: classification.source,
      });
      return { classification, rule, ai };
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

function toAiClassification(record: {
  relevanceScore: number;
  category: string;
  decision: StoredClassification["decision"];
  reason: string | null;
  confidence: number;
}): AiClassification {
  return {
    relevanceScore: record.relevanceScore,
    category: record.category as GoalCategory,
    decision: record.decision.toLowerCase() as AiClassification["decision"],
    reason: record.reason ?? "Cached classification",
    confidence: record.confidence,
  };
}
