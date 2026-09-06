import "./popup.css";
import {
  GET_RECENT_ACTIVITY,
  type ExtensionResponse,
} from "./messages";

const list = document.getElementById("events");
const empty = document.getElementById("empty");

function render(events: ExtensionResponse["events"]) {
  if (!list || !empty) return;

  list.replaceChildren();
  empty.hidden = events.length > 0;

  for (const event of events) {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = event.title ?? event.domain;
    const meta = document.createElement("span");
    meta.textContent = `${event.domain} · tab ${event.tabId}`;
    item.append(title, meta);
    list.append(item);
  }
}

chrome.runtime.sendMessage(
  { type: GET_RECENT_ACTIVITY },
  (response: ExtensionResponse | undefined) => {
    if (chrome.runtime.lastError || response?.type !== "RECENT_ACTIVITY") {
      render([]);
      return;
    }
    render(response.events);
  },
);
