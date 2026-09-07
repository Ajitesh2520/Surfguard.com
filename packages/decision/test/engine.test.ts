import assert from "node:assert/strict";
import { test } from "node:test";
import type { RuleResult } from "@surfguard/rules";
import type { AiClassification } from "@surfguard/shared";
import { decide } from "../src/index";
import type { DecisionEngineInput } from "../src/index";

const catalogAllow: RuleResult = {
  decision: "ALLOW",
  source: "catalog",
  reason: "productive_domain",
  matchedDomain: "github.com",
};

const catalogBlock: RuleResult = {
  decision: "BLOCK",
  source: "catalog",
  reason: "distracting_domain",
  matchedDomain: "instagram.com",
};

const unknownRule: RuleResult = {
  decision: "UNKNOWN",
  source: "none",
  reason: "no_matching_rule",
  matchedDomain: null,
};

function classification(
  overrides: Partial<AiClassification> = {},
): AiClassification {
  return {
    relevanceScore: 0.5,
    category: "CODING",
    decision: "nudge",
    reason: "Uncertain",
    confidence: 0.5,
    ...overrides,
  };
}

function input(overrides: Partial<DecisionEngineInput> = {}): DecisionEngineInput {
  return {
    domain: "example.com",
    goal: {
      title: "Write the API",
      category: "CODING",
      topics: ["typescript", "express"],
      keywords: ["prisma"],
    },
    strictness: "BALANCED",
    rule: unknownRule,
    classification: null,
    preferences: {},
    recentContext: [],
    timeSpentMs: 5_000,
    drift: {
      offGoalStreak: 0,
      offGoalRatio: 0,
      repeatedOffGoalDomain: false,
    },
    ...overrides,
  };
}

test("relevant page", () => {
  const result = decide(
    input({
      domain: "typescriptlang.org",
      classification: classification({
        relevanceScore: 0.92,
        decision: "allow",
        confidence: 0.88,
        reason: "Docs match the coding goal",
      }),
    }),
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "ai");
});

test("irrelevant page", () => {
  const result = decide(
    input({
      domain: "youtube.com",
      classification: classification({
        relevanceScore: 0.08,
        decision: "block",
        confidence: 0.7,
        reason: "Entertainment video",
      }),
    }),
  );
  assert.equal(result.decision, "WARN");
  assert.equal(result.source, "ai");
});

test("high AI confidence", () => {
  const result = decide(
    input({
      domain: "youtube.com",
      classification: classification({
        relevanceScore: 0.12,
        decision: "block",
        confidence: 0.96,
        reason: "Clearly off-goal",
      }),
    }),
  );
  assert.equal(result.decision, "WARN");
  assert.match(result.reason, /off-goal/i);
});

test("low AI confidence", () => {
  const result = decide(
    input({
      domain: "obscure-blog.com",
      classification: classification({
        relevanceScore: 0.2,
        decision: "block",
        confidence: 0.2,
        reason: "Guessing",
      }),
    }),
  );
  assert.equal(result.decision, "NUDGE");
  assert.match(result.reason, /low-confidence/i);
});

test("relaxed session", () => {
  const result = decide(
    input({
      domain: "instagram.com",
      strictness: "RELAXED",
      rule: catalogBlock,
    }),
  );
  assert.equal(result.decision, "NUDGE");
  assert.equal(result.source, "session");
});

test("balanced session", () => {
  const result = decide(
    input({
      domain: "instagram.com",
      strictness: "BALANCED",
      rule: catalogBlock,
    }),
  );
  assert.equal(result.decision, "WARN");
  assert.equal(result.source, "session");
});

test("strict session", () => {
  const result = decide(
    input({
      domain: "instagram.com",
      strictness: "STRICT",
      rule: catalogBlock,
    }),
  );
  assert.equal(result.decision, "BLOCK");
  assert.equal(result.source, "session");
});

test("explicit allow", () => {
  const result = decide(
    input({
      domain: "instagram.com",
      strictness: "STRICT",
      rule: catalogBlock,
      classification: classification({
        relevanceScore: 0.05,
        decision: "block",
        confidence: 0.99,
      }),
      preferences: { allowDomains: ["instagram.com"] },
    }),
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "user");
});

test("explicit block", () => {
  const result = decide(
    input({
      domain: "github.com",
      strictness: "RELAXED",
      rule: catalogAllow,
      classification: classification({
        relevanceScore: 0.95,
        decision: "allow",
        confidence: 0.99,
      }),
      preferences: { blockDomains: ["github.com"] },
    }),
  );
  assert.equal(result.decision, "BLOCK");
  assert.equal(result.source, "user");
});
