import type { InterventionDecision, SessionStrictness } from "@surfguard/shared";

export const HIGH_CONFIDENCE = 0.75;
export const LOW_CONFIDENCE = 0.45;
export const RELEVANT_SCORE = 0.6;
export const DRIFT_STREAK = 3;
export const DRIFT_RATIO = 0.7;
export const ESCALATE_AFTER_MS = 2 * 60 * 1000;

export function fromAiDecision(
  decision: "allow" | "nudge" | "warn" | "block",
): InterventionDecision {
  return decision.toUpperCase() as InterventionDecision;
}

export function capForStrictness(
  decision: InterventionDecision,
  strictness: SessionStrictness,
): InterventionDecision {
  if (strictness === "RELAXED") {
    if (decision === "BLOCK" || decision === "WARN") return "NUDGE";
    return decision;
  }
  if (strictness === "BALANCED" && decision === "BLOCK") {
    return "WARN";
  }
  return decision;
}
