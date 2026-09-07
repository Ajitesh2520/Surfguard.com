import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeContext, classifyPage } from "../src/index";
import type { ContextActivity, ContextEngineInput } from "../src/index";

const goal = {
  title: "Build the React app",
  category: "CODING",
  topics: ["react", "typescript"],
  keywords: ["hooks"],
};

function at(minutes: number): string {
  return new Date(Date.UTC(2026, 0, 1, 10, minutes, 0)).toISOString();
}

function activity(
  rows: { domain: string; minute: number; durationMs?: number }[],
): ContextActivity[] {
  return rows.map((row) => ({
    domain: row.domain,
    occurredAt: at(row.minute),
    durationMs: row.durationMs,
  }));
}

function analyze(rows: ContextActivity[]) {
  const input: ContextEngineInput = { activity: rows, goal };
  return analyzeContext(input);
}

test("empty activity is focused", () => {
  const result = analyzeContext({ activity: [], goal });
  assert.equal(result.pattern, "focused");
  assert.equal(result.driftScore, 0);
});

test("sustained productive activity", () => {
  const result = analyze(
    activity([
      { domain: "react.dev", minute: 0 },
      { domain: "github.com", minute: 2 },
      { domain: "stackoverflow.com", minute: 4 },
      { domain: "developer.mozilla.org", minute: 6 },
    ]),
  );
  assert.equal(result.pattern, "focused");
  assert.ok(result.driftScore < 0.2);
  assert.equal(result.signals.sustainedProductive, true);
  assert.match(result.reason, /productive/i);
});

test("example drift into distractions", () => {
  const result = analyze(
    activity([
      { domain: "react.dev", minute: 0 },
      { domain: "github.com", minute: 2 },
      { domain: "stackoverflow.com", minute: 4 },
      { domain: "instagram.com", minute: 6 },
      { domain: "youtube.com", minute: 8 },
      { domain: "reddit.com", minute: 10 },
    ]),
  );
  assert.ok(result.driftScore >= 0.5);
  assert.ok(result.driftScore <= 1);
  assert.equal(result.signals.offGoalStreak, 3);
  assert.ok(["drifting", "spiraling"].includes(result.pattern));
  assert.match(result.reason, /irrelevant|drifting|distraction/i);
});

test("repeated return to a distracting domain", () => {
  const result = analyze(
    activity([
      { domain: "github.com", minute: 0 },
      { domain: "instagram.com", minute: 2 },
      { domain: "github.com", minute: 4 },
      { domain: "instagram.com", minute: 6 },
    ]),
  );
  assert.equal(result.signals.repeatedOffGoalDomain, true);
  assert.equal(result.pattern, "drifting");
});

test("rapid domain switching", () => {
  const result = analyze(
    activity([
      { domain: "github.com", minute: 0, durationMs: 5_000 },
      { domain: "news.example", minute: 0, durationMs: 4_000 },
      { domain: "instagram.com", minute: 0, durationMs: 6_000 },
      { domain: "docs.example", minute: 0, durationMs: 3_000 },
      { domain: "youtube.com", minute: 0, durationMs: 5_000 },
    ]),
  );
  assert.equal(result.signals.rapidSwitching, true);
  assert.equal(result.pattern, "switching");
});

test("increasing distraction time spirals", () => {
  const result = analyze(
    activity([
      { domain: "instagram.com", minute: 0, durationMs: 20_000 },
      { domain: "youtube.com", minute: 1, durationMs: 90_000 },
      { domain: "reddit.com", minute: 3, durationMs: 240_000 },
    ]),
  );
  assert.equal(result.signals.increasingDistractionTime, true);
  assert.equal(result.pattern, "spiraling");
  assert.ok(result.driftScore >= 0.65);
});

test("return to productive activity recovers", () => {
  const result = analyze(
    activity([
      { domain: "github.com", minute: 0 },
      { domain: "instagram.com", minute: 2 },
      { domain: "youtube.com", minute: 4 },
      { domain: "react.dev", minute: 6 },
      { domain: "stackoverflow.com", minute: 8 },
    ]),
  );
  assert.equal(result.signals.returnedToProductive, true);
  assert.equal(result.pattern, "recovering");
  assert.ok(result.driftScore < 0.55);
});

test("classifies pages with goal keywords", () => {
  assert.equal(classifyPage("react.dev", "React", { goal }), "relevant");
  assert.equal(classifyPage("instagram.com", "Feed", { goal }), "irrelevant");
  assert.equal(
    classifyPage("blog.example", "Using React hooks", { goal }),
    "relevant",
  );
});
