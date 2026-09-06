import type { Goal, GoalCategory } from "@surfguard/shared";

export type GoalFormValues = {
  title: string;
  description: string;
  category: GoalCategory;
  topics: string;
  keywords: string;
  isActive: boolean;
};

export function goalToFormValues(goal: Goal): GoalFormValues {
  return {
    title: goal.title,
    description: goal.description ?? "",
    category: goal.category,
    topics: goal.topics.join(", "),
    keywords: goal.keywords.join(", "),
    isActive: goal.isActive,
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formValuesToPayload(values: GoalFormValues) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    topics: parseTags(values.topics),
    keywords: parseTags(values.keywords),
    isActive: values.isActive,
  };
}
