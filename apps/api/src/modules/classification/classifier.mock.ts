import type { AiClassification } from "@surfguard/shared";
import type { AiClassificationInput, AiClassifier } from "./classifier";
import { fallbackClassification } from "./classifier";

export type MockClassifier = AiClassifier & {
  calls: AiClassificationInput[];
};

export function createMockClassifier(
  handler?: (
    input: AiClassificationInput,
  ) => AiClassification | Promise<AiClassification>,
): MockClassifier {
  const calls: AiClassificationInput[] = [];
  return {
    calls,
    async classify(input) {
      calls.push(input);
      if (handler) return handler(input);
      return fallbackClassification(input, "mock_classifier");
    },
  };
}
