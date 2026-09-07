export type AnalyticsDelta = {
  focusTimeMs?: number;
  productiveTimeMs?: number;
  distractedTimeMs?: number;
  interventions?: number;
  blockedAttempts?: number;
  nudges?: number;
  warns?: number;
  contextSwitches?: number;
  driftScore?: number;
  completedSessions?: number;
};

export type AnalyticsDailyRow = {
  userId: string;
  day: string;
  focusTimeMs: number;
  productiveTimeMs: number;
  distractedTimeMs: number;
  interventions: number;
  blockedAttempts: number;
  nudges: number;
  warns: number;
  contextSwitches: number;
  driftScoreSum: number;
  driftScoreCount: number;
  completedSessions: number;
};

export type AnalyticsDailyStore = {
  apply(userId: string, day: Date, delta: AnalyticsDelta): Promise<void>;
  listRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<AnalyticsDailyRow[]>;
};

export function utcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function dayKey(date: Date): string {
  return utcDay(date).toISOString().slice(0, 10);
}

export function emptyDaily(
  userId: string,
  day: string,
): AnalyticsDailyRow {
  return {
    userId,
    day,
    focusTimeMs: 0,
    productiveTimeMs: 0,
    distractedTimeMs: 0,
    interventions: 0,
    blockedAttempts: 0,
    nudges: 0,
    warns: 0,
    contextSwitches: 0,
    driftScoreSum: 0,
    driftScoreCount: 0,
    completedSessions: 0,
  };
}
