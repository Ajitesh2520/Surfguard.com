import type {
  AnalyticsDistractionRow,
  AnalyticsGoalPerformance,
  AnalyticsOverview,
  AnalyticsResponse,
  AnalyticsSessionRow,
  AnalyticsTimelineItem,
} from "@surfguard/shared";
import type { ClassificationStore } from "../classification/classification.store";
import type { EventRecord, EventStore } from "../events/event.store";
import type { GoalStore } from "../goals/goal.store";
import type { InterventionStore } from "../interventions/intervention.store";
import type { SessionStore } from "../sessions/session.store";
import {
  emptyDaily,
  utcDay,
  type AnalyticsDailyRow,
  type AnalyticsDailyStore,
  type AnalyticsDelta,
} from "./analytics.store";

const MAX_DWELL_MS = 10 * 60 * 1000;
const CACHE_TTL_MS = 20_000;
const TIMELINE_LIMIT = 50;
const SESSION_LIMIT = 50;
const INTERVENTION_LIMIT = 50;
const AGGREGATE_EVENT_LIMIT = 200;

export type IngestAnalyticsInput = {
  userId: string;
  previous: EventRecord | null;
  current: EventRecord;
  goalTitle: string | null;
  decision: "ALLOW" | "NUDGE" | "WARN" | "BLOCK" | null;
  reason: string | null;
  driftScore: number | null;
};

export function parseAnalyticsDays(value: unknown): number {
  if (value === undefined || value === "") return 7;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 90) {
    return -1;
  }
  return parsed;
}

export function createAnalyticsService(deps: {
  daily: AnalyticsDailyStore;
  events: EventStore;
  sessions: SessionStore;
  goals: GoalStore;
  classifications: ClassificationStore;
  interventions: InterventionStore;
  now?: () => Date;
  cacheTtlMs?: number;
}) {
  const cache = new Map<string, { expires: number; value: AnalyticsResponse }>();
  const ttl = deps.cacheTtlMs ?? CACHE_TTL_MS;
  const now = deps.now ?? (() => new Date());

  function invalidate(userId: string) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${userId}:`)) cache.delete(key);
    }
  }

  async function apply(userId: string, at: Date, delta: AnalyticsDelta) {
    await deps.daily.apply(userId, at, delta);
    invalidate(userId);
  }

  return {
    invalidate,

    async recordCompletedSession(
      userId: string,
      durationMs: number,
      at: Date,
    ) {
      await apply(userId, at, {
        focusTimeMs: durationMs,
        completedSessions: 1,
      });
    },

    async recordIngest(input: IngestAnalyticsInput) {
      const delta: AnalyticsDelta = {};
      const { previous, current } = input;

      if (previous) {
        const dwell = Math.min(
          MAX_DWELL_MS,
          Math.max(
            0,
            current.occurredAt.getTime() - previous.occurredAt.getTime(),
          ),
        );
        await deps.events.updateMetrics(previous.id, { durationMs: dwell });

        const previousClass = await deps.classifications.findByEventId(
          previous.id,
        );
        if (previousClass && dwell > 0) {
          if (previousClass.decision === "ALLOW" && previousClass.relevant) {
            delta.productiveTimeMs = dwell;
          } else {
            delta.distractedTimeMs = dwell;
          }
        }

        if (previous.domain !== current.domain) {
          delta.contextSwitches = 1;
        }
      }

      if (input.decision === "NUDGE") {
        delta.nudges = 1;
        delta.interventions = 1;
      } else if (input.decision === "WARN") {
        delta.warns = 1;
        delta.interventions = 1;
      } else if (input.decision === "BLOCK") {
        delta.blockedAttempts = 1;
        delta.interventions = 1;
      }

      if (input.driftScore !== null) {
        delta.driftScore = input.driftScore;
        await deps.events.updateMetrics(current.id, {
          driftScore: input.driftScore,
        });
      }

      if (input.decision === "NUDGE" || input.decision === "WARN" || input.decision === "BLOCK") {
        await deps.interventions.create({
          userId: input.userId,
          focusSessionId: current.focusSessionId,
          browsingEventId: current.id,
          kind: input.decision,
          message: input.reason,
          domain: current.domain,
          goalTitle: input.goalTitle,
        });
      }

      if (Object.keys(delta).length > 0) {
        await apply(input.userId, current.occurredAt, delta);
      } else {
        invalidate(input.userId);
      }
    },

    async get(userId: string, days: number): Promise<AnalyticsResponse> {
      const cacheKey = `${userId}:${days}`;
      const hit = cache.get(cacheKey);
      if (hit && hit.expires > Date.now()) {
        return hit.value;
      }

      const end = utcDay(now());
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - (days - 1));

      const [rows, sessionRecords, goals, events, interventionRows] =
        await Promise.all([
          deps.daily.listRange(userId, start, end),
          deps.sessions.listByUser(userId),
          deps.goals.listByUser(userId),
          deps.events.listByUserSince(userId, start, AGGREGATE_EVENT_LIMIT),
          deps.interventions.listByUserSince(userId, start, INTERVENTION_LIMIT),
        ]);

      const overview = summarize(rows);
      const goalById = new Map(goals.map((goal) => [goal.id, goal.title]));
      const sessionsInRange = sessionRecords.filter(
        (session) => session.startTime >= start,
      );

      const sessions: AnalyticsSessionRow[] = sessionsInRange
        .slice(0, SESSION_LIMIT)
        .map((session) => ({
          id: session.id,
          goalId: session.goalId,
          goalTitle: goalById.get(session.goalId) ?? "Unknown goal",
          status: session.status,
          strictness: session.strictness,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime ? session.endTime.toISOString() : null,
          durationMs: session.durationMs,
        }));

      const classifications = await deps.classifications.findByEventIds(
        events.map((event) => event.id),
      );
      const classByEvent = new Map(
        classifications.map((row) => [row.browsingEventId, row]),
      );

      const timeline: AnalyticsTimelineItem[] = events
        .slice(0, TIMELINE_LIMIT)
        .map((event) => ({
          id: event.id,
          occurredAt: event.occurredAt.toISOString(),
          domain: event.domain,
          title: event.title,
          decision: classByEvent.get(event.id)?.decision ?? null,
          durationMs: event.durationMs,
          driftScore: event.driftScore,
        }));

      const sessionGoal = new Map(
        sessionRecords.map((session) => [session.id, session.goalId]),
      );
      const goalStats = new Map<string, AnalyticsGoalPerformance>();
      for (const session of sessionsInRange) {
        const title = goalById.get(session.goalId) ?? "Unknown goal";
        const current = goalStats.get(session.goalId) ?? {
          goalId: session.goalId,
          title,
          sessions: 0,
          completedSessions: 0,
          focusTimeMs: 0,
          productiveTimeMs: 0,
          distractedTimeMs: 0,
        };
        current.sessions += 1;
        if (session.status === "COMPLETED") {
          current.completedSessions += 1;
          current.focusTimeMs += session.durationMs ?? 0;
        }
        goalStats.set(session.goalId, current);
      }

      const distractions = new Map<string, AnalyticsDistractionRow>();
      for (const event of events) {
        const classified = classByEvent.get(event.id);
        const goalId = event.focusSessionId
          ? sessionGoal.get(event.focusSessionId)
          : undefined;
        if (classified && goalId && goalStats.has(goalId)) {
          const stats = goalStats.get(goalId)!;
          const dwell = event.durationMs ?? 0;
          if (classified.decision === "ALLOW" && classified.relevant) {
            stats.productiveTimeMs += dwell;
          } else {
            stats.distractedTimeMs += dwell;
          }
        }

        const distracted =
          classified &&
          !(classified.decision === "ALLOW" && classified.relevant);
        if (!distracted) continue;
        const row = distractions.get(event.domain) ?? {
          domain: event.domain,
          visits: 0,
          distractedTimeMs: 0,
          blocks: 0,
          nudges: 0,
        };
        row.visits += 1;
        row.distractedTimeMs += event.durationMs ?? 0;
        if (classified.decision === "BLOCK") row.blocks += 1;
        if (classified.decision === "NUDGE") row.nudges += 1;
        distractions.set(event.domain, row);
      }

      const value: AnalyticsResponse = {
        rangeDays: days,
        overview,
        sessions,
        timeline,
        goals: [...goalStats.values()].sort(
          (a, b) => b.focusTimeMs - a.focusTimeMs,
        ),
        distractions: [...distractions.values()]
          .sort((a, b) => b.distractedTimeMs - a.distractedTimeMs)
          .slice(0, 20),
        interventions: interventionRows.map((row) => ({
          id: row.id,
          kind: row.kind,
          message: row.message,
          createdAt: row.createdAt.toISOString(),
          domain: row.domain,
          goalTitle: row.goalTitle,
        })),
      };

      cache.set(cacheKey, { expires: Date.now() + ttl, value });
      return value;
    },
  };
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;

function summarize(rows: AnalyticsDailyRow[]): AnalyticsOverview {
  const totals = rows.reduce(
    (acc, row) => ({
      ...acc,
      focusTimeMs: acc.focusTimeMs + row.focusTimeMs,
      productiveTimeMs: acc.productiveTimeMs + row.productiveTimeMs,
      distractedTimeMs: acc.distractedTimeMs + row.distractedTimeMs,
      interventions: acc.interventions + row.interventions,
      blockedAttempts: acc.blockedAttempts + row.blockedAttempts,
      nudges: acc.nudges + row.nudges,
      warns: acc.warns + row.warns,
      contextSwitches: acc.contextSwitches + row.contextSwitches,
      driftScoreSum: acc.driftScoreSum + row.driftScoreSum,
      driftScoreCount: acc.driftScoreCount + row.driftScoreCount,
      completedSessions: acc.completedSessions + row.completedSessions,
    }),
    emptyDaily("", ""),
  );

  return {
    focusTimeMs: totals.focusTimeMs,
    productiveTimeMs: totals.productiveTimeMs,
    distractedTimeMs: totals.distractedTimeMs,
    interventions: totals.interventions,
    blockedAttempts: totals.blockedAttempts,
    nudges: totals.nudges,
    contextSwitches: totals.contextSwitches,
    averageDriftScore:
      totals.driftScoreCount === 0
        ? 0
        : totals.driftScoreSum / totals.driftScoreCount,
    completedSessions: totals.completedSessions,
  };
}
