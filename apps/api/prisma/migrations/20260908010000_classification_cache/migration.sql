-- AlterTable
ALTER TABLE "classifications" ADD COLUMN "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "classifications" ADD COLUMN "category" TEXT;

-- CreateTable
CREATE TABLE "classification_cache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "decision" "Decision" NOT NULL,
    "category" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "relevant" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "source" "ClassificationSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classification_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "classification_cache_userId_goalId_url_key" ON "classification_cache"("userId", "goalId", "url");
CREATE INDEX "classification_cache_userId_domain_idx" ON "classification_cache"("userId", "domain");

ALTER TABLE "classification_cache" ADD CONSTRAINT "classification_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "classification_cache" ADD CONSTRAINT "classification_cache_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
