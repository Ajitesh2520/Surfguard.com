import type { InterventionPayload } from "@surfguard/shared";
import {
  INTERVENTION_CONTINUE,
  INTERVENTION_GO_BACK,
  isShowInterventionMessage,
} from "./intervention";

const HOST_ID = "surfguard-host";

chrome.runtime.onMessage.addListener((message) => {
  if (!isShowInterventionMessage(message)) return;
  try {
    show(message.intervention);
  } catch {
    removeHost();
  }
});

function show(intervention: InterventionPayload) {
  removeHost();
  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.append(style(), card(intervention));
  document.documentElement.append(host);

  if (intervention.decision === "NUDGE") {
    window.setTimeout(() => host.remove(), 4500);
  }
}

function card(intervention: InterventionPayload): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className =
    intervention.decision === "NUDGE" ? "toast" : "panel";

  const title = document.createElement("strong");
  title.textContent =
    intervention.decision === "NUDGE" ? "Stay on goal" : "Check this page";

  const reason = document.createElement("p");
  reason.textContent = intervention.reason;

  wrap.append(title, reason);

  if (intervention.decision === "WARN") {
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `${intervention.goalTitle} · ${intervention.pageTitle ?? intervention.domain}`;
    wrap.append(meta);

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(
      button("Back", () => {
        chrome.runtime.sendMessage({ type: INTERVENTION_GO_BACK });
        removeHost();
      }),
      button("Dismiss", () => removeHost()),
      button("Continue", () => {
        chrome.runtime.sendMessage({
          type: INTERVENTION_CONTINUE,
          url: intervention.url,
          navigate: false,
        });
        removeHost();
      }),
    );
    wrap.append(actions);
  }

  return wrap;
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  node.addEventListener("click", onClick);
  return node;
}

function removeHost() {
  document.getElementById(HOST_ID)?.remove();
}

function style(): HTMLStyleElement {
  const node = document.createElement("style");
  node.textContent = `
    :host { all: initial; }
    .toast, .panel {
      position: fixed;
      z-index: 2147483647;
      right: 16px;
      bottom: 16px;
      max-width: 320px;
      font: 13px/1.4 system-ui, sans-serif;
      color: #1b1b18;
      background: #fffdf8;
      border: 1px solid #d9d3c5;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12);
      padding: 12px 14px;
    }
    .panel { left: 16px; right: 16px; bottom: 16px; max-width: 420px; margin: auto; }
    strong { display: block; margin-bottom: 4px; }
    p { margin: 0 0 8px; }
    .meta { color: #5c574c; font-size: 12px; }
    .actions { display: flex; gap: 8px; }
    button {
      font: inherit;
      border: 1px solid #cfc8b8;
      background: #fff;
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
    }
  `;
  return node;
}
