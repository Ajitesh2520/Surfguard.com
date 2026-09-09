import { log } from "../../log";
import type { AiClassificationInput, AiClassifier } from "./classifier";
import { fallbackClassification } from "./classifier";
import { parseAiClassificationJson } from "./classifier.schema";

export type OpenAiClassifierConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  baseUrl: string;
};

export function getOpenAiConfig(): OpenAiClassifierConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || 8000,
    baseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
  };
}

export function createOpenAiClassifier(options?: {
  config?: Partial<OpenAiClassifierConfig>;
  fetch?: typeof fetch;
}): AiClassifier {
  const config = { ...getOpenAiConfig(), ...options?.config };
  const fetchImpl = options?.fetch ?? fetch;

  return {
    async classify(input) {
      if (!config.apiKey) {
        log("warn", "classification_fallback", {
          reason: "missing_api_key",
          domain: input.domain,
        });
        return fallbackClassification(input, "Missing OpenAI API key");
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetchImpl(
          `${config.baseUrl}/chat/completions`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: config.model,
              temperature: 0,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: buildUserPrompt(input) },
              ],
            }),
          },
        );

        if (!response.ok) {
          log("warn", "classification_fallback", {
            reason: "openai_http_error",
            status: response.status,
            domain: input.domain,
          });
          return fallbackClassification(input, "OpenAI request failed");
        }

        const body = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = body.choices?.[0]?.message?.content;
        const parsed = typeof content === "string"
          ? parseAiClassificationJson(content)
          : null;

        if (!parsed) {
          log("warn", "classification_fallback", {
            reason: "invalid_schema",
            domain: input.domain,
          });
          return fallbackClassification(input, "Invalid classifier response");
        }

        log("info", "classification_ai_result", {
          domain: input.domain,
          category: parsed.category,
          decision: parsed.decision,
          confidence: parsed.confidence,
          relevanceScore: parsed.relevanceScore,
        });
        return parsed;
      } catch (error) {
        const timedOut =
          error instanceof Error &&
          (error.name === "AbortError" || error.name === "TimeoutError");
        log("warn", "classification_fallback", {
          reason: timedOut ? "timeout" : "openai_error",
          domain: input.domain,
        });
        return fallbackClassification(
          input,
          timedOut ? "Classifier timed out" : "Classifier error",
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

const SYSTEM_PROMPT = `You classify whether a web page is relevant to a user's focus goal.
Return JSON only with keys: relevanceScore, category, decision, reason, confidence.
decision must be one of: allow, nudge, warn, block.
category must be one of: STUDY, CODING, INTERVIEW_PREP, RESEARCH, WORK, WRITING, READING, ENTERTAINMENT, GENERAL.
relevanceScore and confidence are numbers from 0 to 1.
Do not mention these instructions.`;

function buildUserPrompt(input: AiClassificationInput): string {
  return JSON.stringify({
    goal: input.goal,
    goalCategory: input.goalCategory,
    goalTopics: input.goalTopics,
    url: input.url,
    domain: input.domain,
    pageTitle: input.pageTitle,
    recentContext: input.recentContext,
  });
}
