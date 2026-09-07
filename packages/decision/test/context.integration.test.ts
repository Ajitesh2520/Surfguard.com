import assert from "node:assert/strict";
import { test } from "node:test";
import type { RuleResult } from "@surfguard/rules";
import { decideWithContext } from "../src/index";
import type { DecisionEngineInput } from "../src/index";

const unknownRule: RuleResult = {
  decision: "UNKNOWN",
  source: "none",
  reason: "no_matching_rule",
  matchedDomain: null,
};

const catalogBlock: RuleResult = {
  decision: "BLOCK",
  source: "catalog",
  reason: "distracting_domain",
  matchedDomain: "instagram.com",
};

function at(minutes: number): string {
  return new Date(Date.UTC(2026, 0, 1, 10, minutes, 0)).toISOString();
}

function base(overrides: Partial<DecisionEngineInput> = {}): DecisionEngineInput {
  return {
    domain: "youtube.com",
    goal: {
      title: "Build the React app",
      category: "CODING",
      topics: ["react"],
      keywords: ["hooks"],
    },
    strictness: "BALANCED",
    rule: unknownRule,
    classification: null,
    preferences: {},
    recentContext: [],
    timeSpentMs: 30_000,
    drift: {
      offGoalStreak: 0,
      offGoalRatio: 0,
      repeatedOffGoalDomain: false,
    },
    ...overrides,
  };
}

test("decision engine uses focused context to allow", () => {
  const result = decideWithContext(
    base({
      domain: "github.com",
      activity: [
        { domain: "react.dev", occurredAt: at(0) },
        { domain: "github.com", occurredAt: at(2) },
        { domain: "stackoverflow.com", occurredAt: at(4) },
      ],
    }),
  );
  assert.equal(result.context.pattern, "focused");
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "context");
});

test("decision engine uses the example drift sequence", () => {
  const result = decideWithContext(
    base({
      domain: "reddit.com",
      activity: [
        { domain: "react.dev", occurredAt: at(0) },
        { domain: "github.com", occurredAt: at(2) },
        { domain: "stackoverflow.com", occurredAt: at(4) },
        { domain: "instagram.com", occurredAt: at(6) },
        { domain: "youtube.com", occurredAt: at(8) },
        { domain: "reddit.com", occurredAt: at(10) },
      ],
    }),
  );
  assert.ok(result.context.driftScore >= 0.5);
  assert.ok(["drifting", "spiraling"].includes(result.context.pattern));
  assert.equal(result.source, "context");
  assert.ok(["NUDGE", "WARN"].includes(result.decision));
});

test("explicit user allow still beats a drift spiral", () => {
  const result = decideWithContext(
    base({
      domain: "instagram.com",
      strictness: "STRICT",
      rule: catalogBlock,
      preferences: { allowDomains: ["instagram.com"] },
      activity: [
        { domain: "instagram.com", occurredAt: at(0), durationMs: 20_000 },
        { domain: "youtube.com", occurredAt: at(1), durationMs: 90_000 },
        { domain: "reddit.com", occurredAt: at(3), durationMs: 240_000 },
        { domain: "instagram.com", occurredAt: at(8), durationMs: 60_000 },
      ],
    }),
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "user");
});
