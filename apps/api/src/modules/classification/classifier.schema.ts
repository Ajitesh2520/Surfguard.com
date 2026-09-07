import {
  AI_DECISIONS,
  GOAL_CATEGORIES,
  type AiClassification,
  type GoalCategory,
} from "@surfguard/shared";
import { z } from "zod";

const categories = GOAL_CATEGORIES as unknown as [
  GoalCategory,
  ...GoalCategory[],
];
const decisions = AI_DECISIONS as unknown as [
  (typeof AI_DECISIONS)[number],
  ...(typeof AI_DECISIONS)[number][],
];

const aiClassificationSchema = z.object({
  relevanceScore: z.coerce.number().min(0).max(1),
  category: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .pipe(z.enum(categories)),
  decision: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.enum(decisions)),
  reason: z.string().trim().min(1).max(500),
  confidence: z.coerce.number().min(0).max(1),
});

export function parseAiClassification(raw: unknown): AiClassification | null {
  const parsed = aiClassificationSchema.safeParse(unwrapPayload(raw));
  if (!parsed.success) return null;
  return {
    relevanceScore: parsed.data.relevanceScore,
    category: parsed.data.category as GoalCategory,
    decision: parsed.data.decision,
    reason: parsed.data.reason,
    confidence: parsed.data.confidence,
  };
}

export function parseAiClassificationJson(text: string): AiClassification | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return parseAiClassification(JSON.parse(trimmed.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function unwrapPayload(raw: unknown): unknown {
  if (typeof raw === "object" && raw !== null && "classification" in raw) {
    return (raw as { classification: unknown }).classification;
  }
  return raw;
}
