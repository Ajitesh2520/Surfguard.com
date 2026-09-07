import type { GoalCategory } from "@surfguard/shared";

export type StoredClassification = {
  browsingEventId: string;
  decision: "ALLOW" | "NUDGE" | "WARN" | "BLOCK";
  relevant: boolean;
  relevanceScore: number;
  category: GoalCategory | string;
  confidence: number;
  source: "RULE" | "CACHE" | "AI";
  reason: string | null;
};

export type ClassificationStore = {
  create(record: StoredClassification): Promise<void>;
  findByEventId(eventId: string): Promise<StoredClassification | null>;
  findByEventIds(eventIds: string[]): Promise<StoredClassification[]>;
};

export type ClassificationCacheRecord = Omit<
  StoredClassification,
  "browsingEventId"
> & {
  userId: string;
  goalId: string;
  url: string;
  domain: string;
};

export type ClassificationCacheStore = {
  get(
    userId: string,
    goalId: string,
    url: string,
  ): Promise<ClassificationCacheRecord | null>;
  set(record: ClassificationCacheRecord): Promise<void>;
};
