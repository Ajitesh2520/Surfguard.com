import cors from "cors";
import express from "express";
import type { HealthResponse } from "@surfguard/shared";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", service: "api" };
    res.json(body);
  });

  return app;
}
