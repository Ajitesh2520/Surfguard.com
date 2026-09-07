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
  };
}
