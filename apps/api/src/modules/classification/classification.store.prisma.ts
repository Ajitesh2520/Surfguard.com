import { prisma } from "../../infra/database";
import type { ClassificationStore } from "./classification.store";

export function createPrismaClassificationStore(): ClassificationStore {
  return {
    async create(record) {
      await prisma.classification.create({
        data: {
          browsingEventId: record.browsingEventId,
          decision: record.decision,
          relevant: record.relevant,
          relevanceScore: record.relevanceScore,
          category: record.category,
          confidence: record.confidence,
          source: record.source,
          reason: record.reason,
        },
      });
    },
  };
}
