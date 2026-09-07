import type { AnalyticsService } from "../analytics/analytics.service";
import { GoalError } from "../goals/goal.errors";
import type { GoalStore } from "../goals/goal.store";
import { SessionError } from "./session.errors";
import {
  calculateDurationMs,
  toPublicSession,
  type SessionStore,
} from "./session.store";
import type { SessionStrictness } from "@surfguard/shared";

export type StartSessionInput = {
  goalId: string;
  strictness: SessionStrictness;
  plannedDurationMinutes: number;
};

export function createSessionService(
  store: SessionStore,
  goalStore: GoalStore,
  clock: () => Date = () => new Date(),
  analytics?: AnalyticsService,
) {
  return {
    async start(userId: string, input: StartSessionInput) {
      const goal = await goalStore.findByUserAndId(userId, input.goalId);
      if (!goal) {
        throw GoalError.notFound();
      }

      const active = await store.findActiveByUser(userId);
      if (active) {
        throw SessionError.alreadyActive();
      }

      const session = await store.create(userId, {
        goalId: input.goalId,
        strictness: input.strictness,
        plannedDurationMinutes: input.plannedDurationMinutes,
        startTime: clock(),
      });
      return toPublicSession(session);
    },

    async list(userId: string) {
      const sessions = await store.listByUser(userId);
      return sessions.map(toPublicSession);
    },

    async get(userId: string, id: string) {
      const session = await store.findByUserAndId(userId, id);
      if (!session) {
        throw SessionError.notFound();
      }
      return toPublicSession(session);
    },

    async stop(userId: string, id: string) {
      const session = await store.findByUserAndId(userId, id);
      if (!session) {
        throw SessionError.notFound();
      }
      if (session.status !== "ACTIVE") {
        throw SessionError.invalidTransition();
      }

      const endTime = clock();
      const stopped = await store.stopByUserAndId(userId, id, {
        status: "COMPLETED",
        endTime,
        durationMs: calculateDurationMs(session.startTime, endTime),
      });
      if (!stopped || stopped.status !== "COMPLETED") {
        throw SessionError.invalidTransition();
      }
      if (analytics && stopped.durationMs !== null && stopped.endTime) {
        await analytics.recordCompletedSession(
          userId,
          stopped.durationMs,
          stopped.endTime,
        );
      }
      return toPublicSession(stopped);
    },
  };
}

export type SessionService = ReturnType<typeof createSessionService>;
