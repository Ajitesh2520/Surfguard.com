-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "focus_sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "focus_sessions" ALTER COLUMN "status" TYPE "SessionStatus_new" USING (
  CASE "status"::text
    WHEN 'ENDED' THEN 'COMPLETED'
    WHEN 'PAUSED' THEN 'CANCELLED'
    ELSE "status"::text
  END::"SessionStatus_new"
);
DROP TYPE "SessionStatus";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
ALTER TABLE "focus_sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
DROP INDEX IF EXISTS "focus_sessions_startedAt_idx";
ALTER TABLE "focus_sessions" RENAME COLUMN "startedAt" TO "startTime";
ALTER TABLE "focus_sessions" RENAME COLUMN "endedAt" TO "endTime";
ALTER TABLE "focus_sessions" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "focus_sessions" ADD COLUMN "plannedDurationMinutes" INTEGER NOT NULL DEFAULT 25;
CREATE INDEX "focus_sessions_startTime_idx" ON "focus_sessions"("startTime");
