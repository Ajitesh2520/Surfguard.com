import type { BrowserActivityEvent } from "@surfguard/shared";

export const GET_RECENT_ACTIVITY = "GET_RECENT_ACTIVITY" as const;
export const RECENT_ACTIVITY = "RECENT_ACTIVITY" as const;

export type GetRecentActivityMessage = {
  type: typeof GET_RECENT_ACTIVITY;
};

export type RecentActivityMessage = {
  type: typeof RECENT_ACTIVITY;
  events: BrowserActivityEvent[];
};

export type ExtensionRequest = GetRecentActivityMessage;
export type ExtensionResponse = RecentActivityMessage;

export function isGetRecentActivityMessage(
  message: unknown,
): message is GetRecentActivityMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === GET_RECENT_ACTIVITY
  );
}
