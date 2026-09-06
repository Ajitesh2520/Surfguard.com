import type { Goal, GoalCategory } from "@surfguard/shared";

export type GoalRecord = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  topics: string[];
  keywords: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalCreateInput = {
  title: string;
  description: string | null;
  category: GoalCategory;
  topics: string[];
  keywords: string[];
  isActive: boolean;
};

export type GoalUpdateInput = {
  title?: string;
  description?: string | null;
  category?: GoalCategory;
  topics?: string[];
  keywords?: string[];
  isActive?: boolean;
};

export type GoalStore = {
  create(userId: string, input: GoalCreateInput): Promise<GoalRecord>;
  listByUser(userId: string): Promise<GoalRecord[]>;
  findByUserAndId(userId: string, id: string): Promise<GoalRecord | null>;
  updateByUserAndId(
    userId: string,
    id: string,
    input: GoalUpdateInput,
  ): Promise<GoalRecord | null>;
  deleteByUserAndId(userId: string, id: string): Promise<boolean>;
};

export function toPublicGoal(goal: GoalRecord): Goal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    topics: goal.topics,
    keywords: goal.keywords,
    isActive: goal.isActive,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
