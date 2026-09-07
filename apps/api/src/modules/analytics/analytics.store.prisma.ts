import { prisma } from "../../infra/database";
import {
  dayKey,
  utcDay,
  type AnalyticsDailyStore,
} from "./analytics.store";

export function createPrismaAnalyticsDailyStore(): AnalyticsDailyStore {
  return {
    async apply(userId, day, delta) {
      const date = utcDay(day);
      await prisma.analyticsDaily.upsert({
        where: { userId_day: { userId, day: date } },
        create: {
          userId,
          day: date,
          focusTimeMs: delta.focusTimeMs ?? 0,
          productiveTimeMs: delta.productiveTimeMs ?? 0,
          distractedTimeMs: delta.distractedTimeMs ?? 0,
          interventions: delta.interventions ?? 0,
          blockedAttempts: delta.blockedAttempts ?? 0,
          nudges: delta.nudges ?? 0,
          warns: delta.warns ?? 0,
          contextSwitches: delta.contextSwitches ?? 0,
          driftScoreSum: delta.driftScore ?? 0,
          driftScoreCount: delta.driftScore === undefined ? 0 : 1,
          completedSessions: delta.completedSessions ?? 0,
        },
        update: {
          focusTimeMs: { increment: delta.focusTimeMs ?? 0 },
          productiveTimeMs: { increment: delta.productiveTimeMs ?? 0 },
          distractedTimeMs: { increment: delta.distractedTimeMs ?? 0 },
          interventions: { increment: delta.interventions ?? 0 },
          blockedAttempts: { increment: delta.blockedAttempts ?? 0 },
          nudges: { increment: delta.nudges ?? 0 },
          warns: { increment: delta.warns ?? 0 },
          contextSwitches: { increment: delta.contextSwitches ?? 0 },
          driftScoreSum: { increment: delta.driftScore ?? 0 },
          driftScoreCount: {
            increment: delta.driftScore === undefined ? 0 : 1,
          },
          completedSessions: { increment: delta.completedSessions ?? 0 },
        },
      });
    },

    async listRange(userId, from, to) {
      const rows = await prisma.analyticsDaily.findMany({
        where: {
          userId,
          day: { gte: utcDay(from), lte: utcDay(to) },
        },
        orderBy: { day: "asc" },
      });
      return rows.map((row) => ({
        userId: row.userId,
        day: dayKey(row.day),
        focusTimeMs: row.focusTimeMs,
        productiveTimeMs: row.productiveTimeMs,
        distractedTimeMs: row.distractedTimeMs,
        interventions: row.interventions,
        blockedAttempts: row.blockedAttempts,
        nudges: row.nudges,
        warns: row.warns,
        contextSwitches: row.contextSwitches,
        driftScoreSum: row.driftScoreSum,
        driftScoreCount: row.driftScoreCount,
        completedSessions: row.completedSessions,
      }));
    },
  };
}
