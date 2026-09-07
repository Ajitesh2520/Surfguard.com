import { prisma } from "../../infra/database";
import type {
  ClassificationStore,
  StoredClassification,
} from "./classification.store";

function toStored(row: {
  browsingEventId: string;
  decision: StoredClassification["decision"];
  relevant: boolean;
  relevanceScore: number;
  category: string | null;
  confidence: number | null;
  source: StoredClassification["source"];
  reason: string | null;
}): StoredClassification {
  return {
    browsingEventId: row.browsingEventId,
    decision: row.decision,
    relevant: row.relevant,
    relevanceScore: row.relevanceScore,
    category: row.category ?? "GENERAL",
    confidence: row.confidence ?? 0,
    source: row.source,
    reason: row.reason,
  };
}

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

    async findByEventId(eventId) {
      const row = await prisma.classification.findUnique({
        where: { browsingEventId: eventId },
      });
      return row ? toStored(row) : null;
    },

    async findByEventIds(eventIds) {
      if (eventIds.length === 0) return [];
      const rows = await prisma.classification.findMany({
        where: { browsingEventId: { in: eventIds } },
      });
      return rows.map(toStored);
    },
  };
}
