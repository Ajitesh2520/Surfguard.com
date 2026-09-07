import { bestDomainMatch, normalizeDomain } from "@surfguard/rules";
import type { InterventionDecision } from "@surfguard/shared";
import {
  DRIFT_RATIO,
  DRIFT_STREAK,
  ESCALATE_AFTER_MS,
  HIGH_CONFIDENCE,
  LOW_CONFIDENCE,
  RELEVANT_SCORE,
  capForStrictness,
  fromAiDecision,
} from "./policy";
import type {
  DecisionEngineInput,
  DecisionResult,
  DecisionSource,
} from "./types";

function result(
  decision: InterventionDecision,
  source: DecisionSource,
  reason: string,
): DecisionResult {
  return { decision, source, reason };
}

function explicitUserRules(input: DecisionEngineInput): DecisionResult | null {
  const host = normalizeDomain(input.domain);
  if (!host) return null;

  const allow = bestDomainMatch(host, input.preferences.allowDomains ?? []);
  const block = bestDomainMatch(host, input.preferences.blockDomains ?? []);

  if (allow && block) {
    if (allow.kind === "exact" && block.kind !== "exact") {
      return result("ALLOW", "user", "Explicit allow rule is more specific");
    }
    if (block.kind === "exact" && allow.kind !== "exact") {
      return result("BLOCK", "user", "Explicit block rule is more specific");
    }
    return result("BLOCK", "user", "Conflicting user rules; block wins");
  }
  if (block) {
    return result("BLOCK", "user", `Explicit block rule for ${block.pattern}`);
  }
  if (allow) {
    return result("ALLOW", "user", `Explicit allow rule for ${allow.pattern}`);
  }

  if (input.rule?.source === "user" && input.rule.decision === "ALLOW") {
    return result("ALLOW", "user", input.rule.reason);
  }
  if (input.rule?.source === "user" && input.rule.decision === "BLOCK") {
    return result("BLOCK", "user", input.rule.reason);
  }

  return null;
}

function sessionRules(input: DecisionEngineInput): DecisionResult | null {
  if (input.rule?.decision !== "BLOCK") return null;
  if (input.rule.source === "user") return null;

  const decision = capForStrictness("BLOCK", input.strictness);
  const label = input.strictness.toLowerCase();
  return result(
    decision,
    "session",
    `Session ${label} policy applied to a distracting domain`,
  );
}

function deterministicRules(input: DecisionEngineInput): DecisionResult | null {
  if (input.rule?.decision === "ALLOW") {
    return result("ALLOW", "rule", input.rule.reason || "Deterministic allow rule");
  }
  return null;
}

function contextSignals(input: DecisionEngineInput): DecisionResult | null {
  const drifted =
    input.drift.offGoalStreak >= DRIFT_STREAK ||
    input.drift.offGoalRatio >= DRIFT_RATIO ||
    input.drift.repeatedOffGoalDomain;
  const lingering = input.timeSpentMs >= ESCALATE_AFTER_MS;

  if (drifted && lingering) {
    const decision = capForStrictness("BLOCK", input.strictness);
    return result(
      decision,
      "context",
      "Sustained off-goal browsing; escalating from recent context",
    );
  }

  if (onGoalContext(input) && !drifted) {
    return result("ALLOW", "context", "Recent context matches the current goal");
  }

  return null;
}

function aiClassification(input: DecisionEngineInput): DecisionResult | null {
  const classification = input.classification;
  if (!classification) return null;

  let decision = fromAiDecision(classification.decision);
  const relevant = classification.relevanceScore >= RELEVANT_SCORE;

  if (relevant && classification.confidence >= HIGH_CONFIDENCE) {
    return result(
      "ALLOW",
      "ai",
      classification.reason || "High-confidence relevant page",
    );
  }

  if (!relevant && decision === "ALLOW") {
    decision = "NUDGE";
  }

  if (classification.confidence >= HIGH_CONFIDENCE) {
    if (!relevant && input.strictness === "STRICT" && decision === "WARN") {
      decision = "BLOCK";
    }
    return result(
      capForStrictness(decision, input.strictness),
      "ai",
      classification.reason || "High-confidence classification",
    );
  }

  if (classification.confidence < LOW_CONFIDENCE) {
    return result(
      "NUDGE",
      "ai",
      "Low-confidence classification; using a softer action",
    );
  }

  return result(
    capForStrictness(decision, input.strictness),
    "ai",
    classification.reason || "AI classification",
  );
}

function onGoalContext(input: DecisionEngineInput): boolean {
  const haystack = input.recentContext.join(" ").toLowerCase();
  if (!haystack) return false;
  const needles = [
    ...(input.goal.topics ?? []),
    ...(input.goal.keywords ?? []),
    input.goal.title ?? "",
    input.goal.category ?? "",
  ]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 2);

  return needles.some((needle) => haystack.includes(needle));
}

export function decide(input: DecisionEngineInput): DecisionResult {
  return (
    explicitUserRules(input) ??
    sessionRules(input) ??
    deterministicRules(input) ??
    contextSignals(input) ??
    aiClassification(input) ??
    result("NUDGE", "default", "No strong signal; defaulting to a gentle nudge")
  );
}

export function createDecisionEngine() {
  return { decide };
}
