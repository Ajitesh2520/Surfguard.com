-- AlterTable
ALTER TABLE "browsing_events" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "browsing_events" ADD COLUMN "driftScore" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "focus_sessions_userId_startTime_idx" ON "focus_sessions"("userId", "startTime");
CREATE INDEX "browsing_events_userId_domain_occurredAt_idx" ON "browsing_events"("userId", "domain", "occurredAt");
CREATE INDEX "classifications_relevant_idx" ON "classifications"("relevant");
CREATE INDEX "interventions_userId_kind_createdAt_idx" ON "interventions"("userId", "kind", "createdAt");

-- CreateTable
CREATE TABLE "analytics_daily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "focusTimeMs" INTEGER NOT NULL DEFAULT 0,
    "productiveTimeMs" INTEGER NOT NULL DEFAULT 0,
    "distractedTimeMs" INTEGER NOT NULL DEFAULT 0,
    "interventions" INTEGER NOT NULL DEFAULT 0,
    "blockedAttempts" INTEGER NOT NULL DEFAULT 0,
    "nudges" INTEGER NOT NULL DEFAULT 0,
    "warns" INTEGER NOT NULL DEFAULT 0,
    "contextSwitches" INTEGER NOT NULL DEFAULT 0,
    "driftScoreSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driftScoreCount" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_daily_userId_day_key" ON "analytics_daily"("userId", "day");
CREATE INDEX "analytics_daily_userId_day_idx" ON "analytics_daily"("userId", "day");

ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
