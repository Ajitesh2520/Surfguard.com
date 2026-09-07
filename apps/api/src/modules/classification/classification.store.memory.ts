import type {
  ClassificationStore,
  StoredClassification,
} from "./classification.store";

export function createMemoryClassificationStore(): ClassificationStore & {
  records: StoredClassification[];
} {
  const records: StoredClassification[] = [];
  return {
    records,
    async create(record) {
      records.push(record);
    },
    async findByEventId(eventId) {
      return (
        records.find((record) => record.browsingEventId === eventId) ?? null
      );
    },
    async findByEventIds(eventIds) {
      const ids = new Set(eventIds);
      return records.filter((record) => ids.has(record.browsingEventId));
    },
  };
}
