import type { InterventionPayload } from "@surfguard/shared";
import {
  INTERVENTION_CONTINUE,
  INTERVENTION_GO_BACK,
} from "./intervention";

const params = new URLSearchParams(window.location.search);
const tabId = Number(params.get("tab"));

void chrome.storage.session.get(`block:${tabId}`).then((result) => {
  const intervention = result[`block:${tabId}`] as
    | InterventionPayload
    | undefined;
  if (!intervention) {
    document.getElementById("reason")!.textContent =
      "This page was paused. You can go back to browsing.";
    return;
  }

  document.getElementById("goal")!.textContent =
    `Goal: ${intervention.goalTitle}`;
  document.getElementById("reason")!.textContent = intervention.reason;

  const continueButton = document.getElementById(
    "continue",
  ) as HTMLButtonElement | null;
  if (continueButton && intervention.canContinue) {
    continueButton.hidden = false;
    continueButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        type: INTERVENTION_CONTINUE,
        url: intervention.url,
        navigate: true,
      });
    });
  }
});

document.getElementById("back")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: INTERVENTION_GO_BACK });
});
