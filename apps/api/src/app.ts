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

export function createApp(options?: { authStore?: AuthStore }) {
  const app = express();
  const authStore = options?.authStore ?? createPrismaAuthStore();
  const authService = createAuthService(authStore);

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
  app.use(errorHandler);

  return app;
}
