import type {
  ClassificationCacheRecord,
  ClassificationCacheStore,
} from "./classification.store";

export function createMemoryClassificationCache(): ClassificationCacheStore {
  const records = new Map<string, ClassificationCacheRecord>();

  return {
    async get(userId, goalId, url) {
      return records.get(cacheKey(userId, goalId, url)) ?? null;
    },
    async set(record) {
      records.set(cacheKey(record.userId, record.goalId, record.url), record);
    },
  };
}

function cacheKey(userId: string, goalId: string, url: string) {
  return `${userId}:${goalId}:${url}`;
}
