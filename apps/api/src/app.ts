import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { HealthResponse } from "@surfguard/shared";
import { errorHandler } from "./middleware/error-handler";
import { getAuthConfig } from "./modules/auth/auth.config";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { createAuthService } from "./modules/auth/auth.service";
import type { AuthStore } from "./modules/auth/auth.store";
import { createPrismaAuthStore } from "./modules/auth/auth.store.prisma";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes";
import { createAnalyticsService } from "./modules/analytics/analytics.service";
import type { AnalyticsDailyStore } from "./modules/analytics/analytics.store";
import { createMemoryAnalyticsDailyStore } from "./modules/analytics/analytics.store.memory";
import { createPrismaAnalyticsDailyStore } from "./modules/analytics/analytics.store.prisma";
import type { AiClassifier } from "./modules/classification/classifier";
import { createPrismaClassificationCache } from "./modules/classification/classification.cache.prisma";
import type { ClassificationCacheStore } from "./modules/classification/classification.store";
import { createPrismaClassificationStore } from "./modules/classification/classification.store.prisma";
import type { ClassificationStore } from "./modules/classification/classification.store";
import { createOpenAiClassifier } from "./modules/classification/classifier.openai";
import { createClassificationPipeline } from "./modules/classification/pipeline";
import { createEventRouter } from "./modules/events/event.routes";
import { createEventService } from "./modules/events/event.service";
import type { EventStore } from "./modules/events/event.store";
import { createPrismaEventStore } from "./modules/events/event.store.prisma";
import { createGoalRouter } from "./modules/goals/goal.routes";
import { createGoalService } from "./modules/goals/goal.service";
import type { GoalStore } from "./modules/goals/goal.store";
import { createPrismaGoalStore } from "./modules/goals/goal.store.prisma";
import type { InterventionStore } from "./modules/interventions/intervention.store";
import { createMemoryInterventionStore } from "./modules/interventions/intervention.store.memory";
import { createPrismaInterventionStore } from "./modules/interventions/intervention.store.prisma";
import { createSessionRouter } from "./modules/sessions/session.routes";
import { createSessionService } from "./modules/sessions/session.service";
import type { SessionStore } from "./modules/sessions/session.store";
import { createPrismaSessionStore } from "./modules/sessions/session.store.prisma";

function corsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean | string) => void,
) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (origin === getAuthConfig().webOrigin) {
    callback(null, origin);
    return;
  }
  if (origin.startsWith("chrome-extension://")) {
    callback(null, origin);
    return;
  }
  callback(null, false);
}

export function createApp(options?: {
  authStore?: AuthStore;
  goalStore?: GoalStore;
  sessionStore?: SessionStore;
  eventStore?: EventStore;
  classifier?: AiClassifier;
  classificationCache?: ClassificationCacheStore;
  classificationStore?: ClassificationStore;
  analyticsDailyStore?: AnalyticsDailyStore;
  interventionStore?: InterventionStore;
}) {
  const app = express();
  const isolated = Boolean(options);
  const authStore = options?.authStore ?? createPrismaAuthStore();
  const goalStore = options?.goalStore ?? createPrismaGoalStore();
  const sessionStore = options?.sessionStore ?? createPrismaSessionStore();
  const eventStore = options?.eventStore ?? createPrismaEventStore();
  const classifier = options?.classifier ?? createOpenAiClassifier();
  const classificationCache =
    options?.classificationCache ?? createPrismaClassificationCache();
  const classificationStore =
    options?.classificationStore ?? createPrismaClassificationStore();
  const analyticsDailyStore =
    options?.analyticsDailyStore ??
    (isolated
      ? createMemoryAnalyticsDailyStore()
      : createPrismaAnalyticsDailyStore());
  const interventionStore =
    options?.interventionStore ??
    (isolated
      ? createMemoryInterventionStore()
      : createPrismaInterventionStore());
  const pipeline = createClassificationPipeline({
    classifier,
    cache: classificationCache,
    classifications: classificationStore,
  });
  const analyticsService = createAnalyticsService({
    daily: analyticsDailyStore,
    events: eventStore,
    sessions: sessionStore,
    goals: goalStore,
    classifications: classificationStore,
    interventions: interventionStore,
  });
  const authService = createAuthService(authStore);
  const goalService = createGoalService(goalStore);
  const sessionService = createSessionService(
    sessionStore,
    goalStore,
    () => new Date(),
    analyticsService,
  );
  const eventService = createEventService(
    eventStore,
    sessionStore,
    goalStore,
    pipeline,
    analyticsService,
  );

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", service: "api" };
    res.json(body);
  });

  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/goals", createGoalRouter(authService, goalService));
  app.use("/api/sessions", createSessionRouter(authService, sessionService));
  app.use("/api/events", createEventRouter(authService, eventService));
  app.use("/api/analytics", createAnalyticsRouter(authService, analyticsService));
  app.use(errorHandler);

  return app;
}
