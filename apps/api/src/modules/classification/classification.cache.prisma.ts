import { prisma } from "../../infra/database";
import type {
  ClassificationCacheRecord,
  ClassificationCacheStore,
} from "./classification.store";

export function createPrismaClassificationCache(): ClassificationCacheStore {
  return {
    async get(userId, goalId, url) {
      const row = await prisma.classificationCache.findUnique({
        where: {
          userId_goalId_url: { userId, goalId, url },
        },
      });
      if (!row) return null;
      return toCacheRecord(row);
    },
    async set(record) {
      await prisma.classificationCache.upsert({
        where: {
          userId_goalId_url: {
            userId: record.userId,
            goalId: record.goalId,
            url: record.url,
          },
        },
        create: record,
        update: {
          domain: record.domain,
          decision: record.decision,
          category: record.category,
          relevanceScore: record.relevanceScore,
          relevant: record.relevant,
          confidence: record.confidence,
          reason: record.reason,
          source: record.source,
        },
      });
    },
  };
}

function toCacheRecord(row: {
  userId: string;
  goalId: string;
  url: string;
  domain: string;
  decision: ClassificationCacheRecord["decision"];
  category: string;
  relevanceScore: number;
  relevant: boolean;
  confidence: number;
  reason: string | null;
  source: ClassificationCacheRecord["source"];
}): ClassificationCacheRecord {
  return {
    userId: row.userId,
    goalId: row.goalId,
    url: row.url,
    domain: row.domain,
    decision: row.decision,
    category: row.category,
    relevanceScore: row.relevanceScore,
    relevant: row.relevant,
    confidence: row.confidence,
    reason: row.reason,
    source: row.source,
  };
}
