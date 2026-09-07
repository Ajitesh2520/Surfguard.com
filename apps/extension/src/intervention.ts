import type { InterventionPayload } from "@surfguard/shared";

export const SHOW_INTERVENTION = "SHOW_INTERVENTION" as const;
export const INTERVENTION_GO_BACK = "INTERVENTION_GO_BACK" as const;
export const INTERVENTION_CONTINUE = "INTERVENTION_CONTINUE" as const;

export type ShowInterventionMessage = {
  type: typeof SHOW_INTERVENTION;
  intervention: InterventionPayload;
};

export type InterventionGoBackMessage = {
  type: typeof INTERVENTION_GO_BACK;
};

export type InterventionContinueMessage = {
  type: typeof INTERVENTION_CONTINUE;
  url: string;
  navigate?: boolean;
};

export function isShowInterventionMessage(
  message: unknown,
): message is ShowInterventionMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === SHOW_INTERVENTION
  );
}

export function isGoBackMessage(
  message: unknown,
): message is InterventionGoBackMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === INTERVENTION_GO_BACK
  );
}

export function isContinueMessage(
  message: unknown,
): message is InterventionContinueMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === INTERVENTION_CONTINUE
  );
}
