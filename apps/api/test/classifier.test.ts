import assert from "node:assert/strict";
import { test } from "node:test";
import type { AiClassificationInput } from "../src/modules/classification/classifier";
import { createOpenAiClassifier } from "../src/modules/classification/classifier.openai";
import { parseAiClassificationJson } from "../src/modules/classification/classifier.schema";

const sampleInput: AiClassificationInput = {
  goal: "Ship the API",
  goalCategory: "CODING",
  goalTopics: ["typescript"],
  url: "https://youtube.com/watch?v=1",
  domain: "youtube.com",
  pageTitle: "Random video",
  recentContext: ["github.com README"],
};

test("validates classifier JSON schema", () => {
  const parsed = parseAiClassificationJson(`
    {"relevanceScore": 0.2, "category": "entertainment", "decision": "WARN", "reason": "Off-goal video", "confidence": 0.8}
  `);
  assert.deepEqual(parsed, {
    relevanceScore: 0.2,
    category: "ENTERTAINMENT",
    decision: "warn",
    reason: "Off-goal video",
    confidence: 0.8,
  });
  assert.equal(parseAiClassificationJson("not json"), null);
});

test("OpenAI provider maps a valid response", async () => {
  const classifier = createOpenAiClassifier({
    config: { apiKey: "test-key", timeoutMs: 1000 },
    fetch: async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  relevanceScore: 0.1,
                  category: "GENERAL",
                  decision: "block",
                  reason: "Distracting",
                  confidence: 0.9,
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
  });

  const result = await classifier.classify(sampleInput);
  assert.equal(result.decision, "block");
  assert.equal(result.confidence, 0.9);
});

test("OpenAI provider falls back on timeout, HTTP error, and invalid schema", async () => {
  const timedOut = createOpenAiClassifier({
    config: { apiKey: "test-key", timeoutMs: 5 },
    fetch: async (_url, init) => {
      await new Promise<void>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
      throw new Error("unreachable");
    },
  });
  const timeoutResult = await timedOut.classify(sampleInput);
  assert.equal(timeoutResult.decision, "nudge");
  assert.equal(timeoutResult.confidence, 0);

  const httpError = createOpenAiClassifier({
    config: { apiKey: "test-key" },
    fetch: async () => new Response("nope", { status: 500 }),
  });
  const httpResult = await httpError.classify(sampleInput);
  assert.equal(httpResult.decision, "nudge");

  const invalid = createOpenAiClassifier({
    config: { apiKey: "test-key" },
    fetch: async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "{}" } }] }),
        { status: 200 },
      ),
  });
  const invalidResult = await invalid.classify(sampleInput);
  assert.equal(invalidResult.decision, "nudge");
});

test("OpenAI provider falls back when the API key is missing", async () => {
  let called = false;
  const classifier = createOpenAiClassifier({
    config: { apiKey: "" },
    fetch: async () => {
      called = true;
      return new Response("{}", { status: 200 });
    },
  });
  const result = await classifier.classify(sampleInput);
  assert.equal(called, false);
  assert.equal(result.decision, "nudge");
});
