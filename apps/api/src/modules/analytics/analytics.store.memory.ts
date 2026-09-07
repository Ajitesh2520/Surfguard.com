import {
  emptyDaily,
  dayKey,
  utcDay,
  type AnalyticsDailyRow,
  type AnalyticsDailyStore,
  type AnalyticsDelta,
} from "./analytics.store";

export function createMemoryAnalyticsDailyStore(): AnalyticsDailyStore {
  const rows = new Map<string, AnalyticsDailyRow>();

  return {
    async apply(userId, day, delta) {
      const key = `${userId}:${dayKey(day)}`;
      const current = rows.get(key) ?? emptyDaily(userId, dayKey(day));
      rows.set(key, applyDelta(current, delta));
    },

    async listRange(userId, from, to) {
      const start = utcDay(from).getTime();
      const end = utcDay(to).getTime();
      return [...rows.values()]
        .filter((row) => {
          if (row.userId !== userId) return false;
          const time = Date.parse(`${row.day}T00:00:00.000Z`);
          return time >= start && time <= end;
        })
        .sort((a, b) => a.day.localeCompare(b.day));
    },
  };
}

function applyDelta(
  row: AnalyticsDailyRow,
  delta: AnalyticsDelta,
): AnalyticsDailyRow {
  return {
    ...row,
    focusTimeMs: row.focusTimeMs + (delta.focusTimeMs ?? 0),
    productiveTimeMs: row.productiveTimeMs + (delta.productiveTimeMs ?? 0),
    distractedTimeMs: row.distractedTimeMs + (delta.distractedTimeMs ?? 0),
    interventions: row.interventions + (delta.interventions ?? 0),
    blockedAttempts: row.blockedAttempts + (delta.blockedAttempts ?? 0),
    nudges: row.nudges + (delta.nudges ?? 0),
    warns: row.warns + (delta.warns ?? 0),
    contextSwitches: row.contextSwitches + (delta.contextSwitches ?? 0),
    driftScoreSum: row.driftScoreSum + (delta.driftScore ?? 0),
    driftScoreCount:
      row.driftScoreCount + (delta.driftScore === undefined ? 0 : 1),
    completedSessions: row.completedSessions + (delta.completedSessions ?? 0),
  };
}
