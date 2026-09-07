import assert from "node:assert/strict";
import { test } from "node:test";
import type { RuleEngineInput } from "../src/index";
import { createRuleEngine, evaluate } from "../src/index";

function input(overrides: Partial<RuleEngineInput> = {}): RuleEngineInput {
  return {
    url: "https://github.com/surfguard",
    domain: "github.com",
    title: "GitHub",
    goal: { title: "Deep work", category: "CODING" },
    preferences: {},
    strictness: "BALANCED",
    ...overrides,
  };
}

test("productive domain", () => {
  const result = evaluate(
    input({ url: "https://github.com/explore", domain: "github.com" }),
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "catalog");
});

test("distracting domain", () => {
  const result = evaluate(
    input({ url: "https://instagram.com/", domain: "instagram.com" }),
  );
  assert.equal(result.decision, "BLOCK");
  assert.equal(result.source, "catalog");
});

test("unknown domain", () => {
  const example = evaluate(
    input({ url: "https://example.com/path", domain: "example.com" }),
  );
  assert.equal(example.decision, "UNKNOWN");

  const youtube = evaluate(
    input({ url: "https://youtube.com/watch?v=1", domain: "youtube.com" }),
  );
  assert.equal(youtube.decision, "UNKNOWN");
});

test("subdomain", () => {
  const gist = evaluate(
    input({ url: "https://gist.github.com/abc", domain: "gist.github.com" }),
  );
  assert.equal(gist.decision, "ALLOW");
  assert.equal(gist.matchedDomain, "github.com");

  const instagram = evaluate(
    input({ url: "https://www.instagram.com/reels", domain: "www.instagram.com" }),
  );
  assert.equal(instagram.decision, "BLOCK");

  const youtubeMobile = evaluate(
    input({ url: "https://m.youtube.com/", domain: "m.youtube.com" }),
  );
  assert.equal(youtubeMobile.decision, "UNKNOWN");
});

test("conflicting rule", () => {
  const userOverridesCatalog = evaluate(
    input({
      url: "https://instagram.com/",
      domain: "instagram.com",
      preferences: { allowDomains: ["instagram.com"] },
    }),
  );
  assert.equal(userOverridesCatalog.decision, "ALLOW");
  assert.equal(userOverridesCatalog.source, "user");

  const userAllowAndBlock = evaluate(
    input({
      url: "https://github.com/",
      domain: "github.com",
      preferences: {
        allowDomains: ["github.com"],
        blockDomains: ["github.com"],
      },
    }),
  );
  assert.equal(userAllowAndBlock.decision, "BLOCK");
  assert.equal(userAllowAndBlock.reason, "conflicting_user_rules");
});

test("invalid URL", () => {
  const malformed = evaluate(input({ url: "not a url", domain: "github.com" }));
  assert.equal(malformed.decision, "UNKNOWN");
  assert.equal(malformed.reason, "invalid_url");

  const chrome = evaluate(
    input({ url: "chrome://settings", domain: "github.com" }),
  );
  assert.equal(chrome.decision, "UNKNOWN");
  assert.equal(chrome.reason, "invalid_url");
});

test("extra evaluators can extend the engine", () => {
  const engine = createRuleEngine({
    extraEvaluators: [
      {
        id: "allow-leetcode",
        evaluate(current) {
          if (current.host === "leetcode.com") {
            return {
              decision: "ALLOW",
              source: "custom",
              reason: "custom_allow",
              matchedDomain: "leetcode.com",
            };
          }
          return null;
        },
      },
    ],
  });

  const result = engine.evaluate(
    input({ url: "https://leetcode.com/problemset", domain: "leetcode.com" }),
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.source, "custom");
});
