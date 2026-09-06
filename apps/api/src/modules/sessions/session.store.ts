import type { FocusSession, SessionStatus, SessionStrictness } from "@surfguard/shared";

export type SessionRecord = {
  id: string;
  userId: string;
  goalId: string;
  strictness: SessionStrictness;
  status: SessionStatus;
  startTime: Date;
  endTime: Date | null;
  durationMs: number | null;
  plannedDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionCreateInput = {
  goalId: string;
  strictness: SessionStrictness;
  plannedDurationMinutes: number;
  startTime: Date;
};

export type SessionStopInput = {
  endTime: Date;
  durationMs: number;
  status: Extract<SessionStatus, "COMPLETED" | "CANCELLED">;
};

export type SessionStore = {
  create(userId: string, input: SessionCreateInput): Promise<SessionRecord>;
  listByUser(userId: string): Promise<SessionRecord[]>;
  findByUserAndId(userId: string, id: string): Promise<SessionRecord | null>;
  findActiveByUser(userId: string): Promise<SessionRecord | null>;
  stopByUserAndId(
    userId: string,
    id: string,
    input: SessionStopInput,
  ): Promise<SessionRecord | null>;
};

export function toPublicSession(session: SessionRecord): FocusSession {
  return {
    id: session.id,
    goalId: session.goalId,
    strictness: session.strictness,
    status: session.status,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime ? session.endTime.toISOString() : null,
    durationMs: session.durationMs,
    plannedDurationMinutes: session.plannedDurationMinutes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export function calculateDurationMs(startTime: Date, endTime: Date): number {
  return Math.max(0, endTime.getTime() - startTime.getTime());
}
