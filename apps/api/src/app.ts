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
import { createGoalRouter } from "./modules/goals/goal.routes";
import { createGoalService } from "./modules/goals/goal.service";
import type { GoalStore } from "./modules/goals/goal.store";
import { createPrismaGoalStore } from "./modules/goals/goal.store.prisma";
import { createSessionRouter } from "./modules/sessions/session.routes";
import { createSessionService } from "./modules/sessions/session.service";
import type { SessionStore } from "./modules/sessions/session.store";
import { createPrismaSessionStore } from "./modules/sessions/session.store.prisma";

export function createApp(options?: {
  authStore?: AuthStore;
  goalStore?: GoalStore;
  sessionStore?: SessionStore;
}) {
  const app = express();
  const authStore = options?.authStore ?? createPrismaAuthStore();
  const goalStore = options?.goalStore ?? createPrismaGoalStore();
  const sessionStore = options?.sessionStore ?? createPrismaSessionStore();
  const authService = createAuthService(authStore);
  const goalService = createGoalService(goalStore);
  const sessionService = createSessionService(sessionStore, goalStore);

  app.use(
    cors({
      origin: getAuthConfig().webOrigin,
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
  app.use(errorHandler);

  return app;
}
