import assert from "node:assert/strict";
import { test } from "node:test";
import { createMemoryClassificationCache } from "../src/modules/classification/classification.cache.memory";
import { createMemoryClassificationStore } from "../src/modules/classification/classification.store.memory";
import { createMockClassifier } from "../src/modules/classification/classifier.mock";
import { createClassificationPipeline } from "../src/modules/classification/pipeline";
import type { GoalRecord } from "../src/modules/goals/goal.store";

const goal: GoalRecord = {
  id: "goal-1",
  userId: "user-1",
  title: "Write code",
  description: null,
  category: "CODING",
  topics: ["typescript"],
  keywords: ["api"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup() {
  const classifier = createMockClassifier(async () => ({
    relevanceScore: 0.15,
    category: "ENTERTAINMENT",
    decision: "warn",
    reason: "Unrelated video",
    confidence: 0.77,
  }));
  const cache = createMemoryClassificationCache();
  const classifications = createMemoryClassificationStore();
  const pipeline = createClassificationPipeline({
    classifier,
    cache,
    classifications,
  });
  return { classifier, classifications, pipeline };
}

test("rule engine ALLOW skips AI", async () => {
  const { classifier, classifications, pipeline } = setup();
  const { classification } = await pipeline.run({
    userId: "user-1",
    eventId: "evt-1",
    url: "https://github.com/explore",
    domain: "github.com",
    title: "Explore",
    goal,
    strictness: "BALANCED",
    recentContext: [],
  });
  assert.equal(classification.decision, "ALLOW");
  assert.equal(classification.source, "RULE");
  assert.equal(classifier.calls.length, 0);
  assert.equal(classifications.records.length, 1);
});

test("rule engine BLOCK skips AI", async () => {
  const { classifier, pipeline } = setup();
  const { classification } = await pipeline.run({
    userId: "user-1",
    eventId: "evt-2",
    url: "https://instagram.com/",
    domain: "instagram.com",
    title: "Instagram",
    goal,
    strictness: "STRICT",
    recentContext: [],
  });
  assert.equal(classification.decision, "BLOCK");
  assert.equal(classification.source, "RULE");
  assert.equal(classifier.calls.length, 0);
});

test("UNKNOWN domains call AI once and then use cache", async () => {
  const { classifier, classifications, pipeline } = setup();
  const first = await pipeline.run({
    userId: "user-1",
    eventId: "evt-3",
    url: "https://youtube.com/watch?v=1",
    domain: "youtube.com",
    title: "Video",
    goal,
    strictness: "BALANCED",
    recentContext: ["github.com Explore"],
  });
  const second = await pipeline.run({
    userId: "user-1",
    eventId: "evt-4",
    url: "https://youtube.com/watch?v=1",
    domain: "youtube.com",
    title: "Video",
    goal,
    strictness: "BALANCED",
    recentContext: [],
  });

  assert.equal(first.classification.decision, "WARN");
  assert.equal(first.classification.source, "AI");
  assert.equal(first.classification.relevanceScore, 0.15);
  assert.equal(second.classification.source, "CACHE");
  assert.equal(second.classification.decision, "WARN");
  assert.equal(classifier.calls.length, 1);
  assert.equal(classifier.calls[0]?.recentContext[0], "github.com Explore");
  assert.equal(classifications.records.length, 2);
});
