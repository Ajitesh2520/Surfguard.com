export { createDecisionEngine, decide } from "./engine";
export {
  DRIFT_RATIO,
  DRIFT_STREAK,
  ESCALATE_AFTER_MS,
  HIGH_CONFIDENCE,
  LOW_CONFIDENCE,
  RELEVANT_SCORE,
} from "./policy";
export type {
  DecisionEngineInput,
  DecisionGoalInput,
  DecisionPreferences,
  DecisionResult,
  DecisionSource,
  DriftSignals,
} from "./types";
