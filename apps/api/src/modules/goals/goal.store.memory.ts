import { randomUUID } from "node:crypto";
import type { GoalRecord, GoalStore, GoalUpdateInput } from "./goal.store";

export function createMemoryGoalStore(): GoalStore {
  const goals = new Map<string, GoalRecord>();

  return {
    async create(userId, input) {
      const now = new Date();
      const goal: GoalRecord = {
        id: randomUUID(),
        userId,
        title: input.title,
        description: input.description,
        category: input.category,
        topics: input.topics,
        keywords: input.keywords,
        isActive: input.isActive,
        createdAt: now,
        updatedAt: now,
      };
      goals.set(goal.id, goal);
      return goal;
    },

    async listByUser(userId) {
      return Array.from(goals.values())
        .filter((goal) => goal.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async findByUserAndId(userId, id) {
      const goal = goals.get(id);
      if (!goal || goal.userId !== userId) return null;
      return goal;
    },

    async updateByUserAndId(userId, id, input: GoalUpdateInput) {
      const goal = goals.get(id);
      if (!goal || goal.userId !== userId) return null;
      const updated: GoalRecord = {
        ...goal,
        ...input,
        description:
          input.description === undefined ? goal.description : input.description,
        updatedAt: new Date(),
      };
      goals.set(id, updated);
      return updated;
    },

    async deleteByUserAndId(userId, id) {
      const goal = goals.get(id);
      if (!goal || goal.userId !== userId) return false;
      goals.delete(id);
      return true;
    },
  };
}
