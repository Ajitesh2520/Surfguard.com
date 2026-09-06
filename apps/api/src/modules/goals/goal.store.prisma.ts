import { Prisma } from "@prisma/client";
import type { GoalCategory } from "@surfguard/shared";
import { prisma } from "../../infra/database";
import { GoalError } from "./goal.errors";
import type { GoalRecord, GoalStore } from "./goal.store";

function toRecord(goal: {
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
}): GoalRecord {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    topics: goal.topics,
    keywords: goal.keywords,
    isActive: goal.isActive,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export function createPrismaGoalStore(): GoalStore {
  return {
    async create(userId, input) {
      const goal = await prisma.goal.create({
        data: {
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          topics: input.topics,
          keywords: input.keywords,
          isActive: input.isActive,
        },
      });
      return toRecord(goal);
    },

    async listByUser(userId) {
      const goals = await prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return goals.map(toRecord);
    },

    async findByUserAndId(userId, id) {
      const goal = await prisma.goal.findFirst({
        where: { id, userId },
      });
      return goal ? toRecord(goal) : null;
    },

    async updateByUserAndId(userId, id, input) {
      const existing = await prisma.goal.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) return null;

      const goal = await prisma.goal.update({
        where: { id },
        data: input,
      });
      return toRecord(goal);
    },

    async deleteByUserAndId(userId, id) {
      const existing = await prisma.goal.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) return false;

      try {
        await prisma.goal.delete({ where: { id } });
        return true;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2003" || error.code === "P2014")
        ) {
          throw GoalError.inUse();
        }
        throw error;
      }
    },
  };
}
