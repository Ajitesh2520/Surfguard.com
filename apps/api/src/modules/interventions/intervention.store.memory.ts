import { randomUUID } from "node:crypto";
import type {
  InterventionCreateInput,
  InterventionRecord,
  InterventionStore,
} from "./intervention.store";

export function createMemoryInterventionStore(): InterventionStore {
  const records: InterventionRecord[] = [];
  return {
    async create(input: InterventionCreateInput) {
      const record: InterventionRecord = {
        id: randomUUID(),
        userId: input.userId,
        focusSessionId: input.focusSessionId,
        browsingEventId: input.browsingEventId,
        kind: input.kind,
        message: input.message,
        createdAt: new Date(),
        domain: input.domain ?? null,
        goalTitle: input.goalTitle ?? null,
      };
      records.unshift(record);
      return record;
    },

    async listByUserSince(userId, since, limit) {
      return records
        .filter(
          (record) => record.userId === userId && record.createdAt >= since,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    },
  };
}
