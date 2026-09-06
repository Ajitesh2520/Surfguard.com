import { GoalError } from "./goal.errors";
import { toPublicGoal, type GoalCreateInput, type GoalStore, type GoalUpdateInput } from "./goal.store";

export function createGoalService(store: GoalStore) {
  return {
    async create(userId: string, input: GoalCreateInput) {
      const goal = await store.create(userId, input);
      return toPublicGoal(goal);
    },

    async list(userId: string) {
      const goals = await store.listByUser(userId);
      return goals.map(toPublicGoal);
    },

    async get(userId: string, id: string) {
      const goal = await store.findByUserAndId(userId, id);
      if (!goal) {
        throw GoalError.notFound();
      }
      return toPublicGoal(goal);
    },

    async update(userId: string, id: string, input: GoalUpdateInput) {
      const goal = await store.updateByUserAndId(userId, id, input);
      if (!goal) {
        throw GoalError.notFound();
      }
      return toPublicGoal(goal);
    },

    async remove(userId: string, id: string) {
      const deleted = await store.deleteByUserAndId(userId, id);
      if (!deleted) {
        throw GoalError.notFound();
      }
    },
  };
}

export type GoalService = ReturnType<typeof createGoalService>;
