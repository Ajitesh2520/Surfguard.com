import type { RuleDecision } from "@surfguard/shared";
import {
  DEFAULT_DISTRACTING_DOMAINS,
  DEFAULT_PRODUCTIVE_DOMAINS,
} from "./catalog";
import { bestDomainMatch, parseHttpHost } from "./domain";
import type {
  NormalizedRuleInput,
  RuleEngineInput,
  RuleEngineOptions,
  RuleEvaluator,
  RuleResult,
} from "./types";

function unknown(reason: string): RuleResult {
  return {
    decision: "UNKNOWN",
    source: "none",
    reason,
    matchedDomain: null,
  };
}

function verdict(
  decision: Exclude<RuleDecision, "UNKNOWN">,
  source: RuleResult["source"],
  reason: string,
  matchedDomain: string,
): RuleResult {
  return { decision, source, reason, matchedDomain };
}

function createUserRuleEvaluator(): RuleEvaluator {
  return {
    id: "user-domain-rules",
    evaluate(input) {
      if (!input.host) return null;

      const allow = bestDomainMatch(
        input.host,
        input.preferences.allowDomains ?? [],
      );
      const block = bestDomainMatch(
        input.host,
        input.preferences.blockDomains ?? [],
      );

      if (allow && block) {
        if (allow.kind === "exact" && block.kind !== "exact") {
          return verdict("ALLOW", "user", "user_allow_more_specific", allow.pattern);
        }
        if (block.kind === "exact" && allow.kind !== "exact") {
          return verdict("BLOCK", "user", "user_block_more_specific", block.pattern);
        }
        return verdict("BLOCK", "user", "conflicting_user_rules", block.pattern);
      }

      if (block) {
        return verdict("BLOCK", "user", "user_block_domain", block.pattern);
      }
      if (allow) {
        return verdict("ALLOW", "user", "user_allow_domain", allow.pattern);
      }
      return null;
    },
  };
}

function createCatalogEvaluator(
  productiveDomains: readonly string[],
  distractingDomains: readonly string[],
): RuleEvaluator {
  return {
    id: "builtin-catalog",
    evaluate(input) {
      if (!input.host) return null;

      const productive = bestDomainMatch(input.host, productiveDomains);
      const distracting = bestDomainMatch(input.host, distractingDomains);

      if (productive && distracting) {
        return unknown("conflicting_catalog_rules");
      }
      if (productive) {
        return verdict("ALLOW", "catalog", "productive_domain", productive.pattern);
      }
      if (distracting) {
        return verdict("BLOCK", "catalog", "distracting_domain", distracting.pattern);
      }
      return null;
    },
  };
}

export function createRuleEngine(options: RuleEngineOptions = {}) {
  const evaluators: RuleEvaluator[] = [
    createUserRuleEvaluator(),
    ...(options.extraEvaluators ?? []),
    createCatalogEvaluator(
      options.productiveDomains ?? DEFAULT_PRODUCTIVE_DOMAINS,
      options.distractingDomains ?? DEFAULT_DISTRACTING_DOMAINS,
    ),
  ];

  function normalize(input: RuleEngineInput): NormalizedRuleInput {
    const host = parseHttpHost(input.url);
    return {
      ...input,
      host,
      validUrl: host !== null,
    };
  }

  function evaluate(input: RuleEngineInput): RuleResult {
    const normalized = normalize(input);
    if (!normalized.validUrl || !normalized.host) {
      return unknown("invalid_url");
    }

    for (const evaluator of evaluators) {
      const result = evaluator.evaluate(normalized);
      if (result) return result;
    }

    return unknown("no_matching_rule");
  }

  return { evaluate, evaluators };
}

export const defaultRuleEngine = createRuleEngine();

export function evaluate(input: RuleEngineInput): RuleResult {
  return defaultRuleEngine.evaluate(input);
}
