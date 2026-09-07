export type InterventionRecord = {
  id: string;
  userId: string;
  focusSessionId: string | null;
  browsingEventId: string | null;
  kind: "NUDGE" | "WARN" | "BLOCK";
  message: string | null;
  createdAt: Date;
  domain: string | null;
  goalTitle: string | null;
};

export type InterventionCreateInput = {
  userId: string;
  focusSessionId: string | null;
  browsingEventId: string | null;
  kind: "NUDGE" | "WARN" | "BLOCK";
  message: string | null;
  domain?: string | null;
  goalTitle?: string | null;
};

export type InterventionStore = {
  create(input: InterventionCreateInput): Promise<InterventionRecord>;
  listByUserSince(
    userId: string,
    since: Date,
    limit: number,
  ): Promise<InterventionRecord[]>;
};
