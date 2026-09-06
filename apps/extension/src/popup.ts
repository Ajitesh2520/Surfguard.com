import "./popup.css";
import { login } from "./api";
import { clearSessionToken, getSessionToken, setSessionToken } from "./auth";
import {
  GET_RECENT_ACTIVITY,
  type ExtensionResponse,
} from "./messages";

const list = document.getElementById("events");
const empty = document.getElementById("empty");
const loginForm = document.getElementById("login-form") as HTMLFormElement | null;
const signedIn = document.getElementById("signed-in");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout");

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

async function renderAuth() {
  const token = await getSessionToken();
  if (loginForm) loginForm.hidden = Boolean(token);
  if (signedIn) signedIn.hidden = !token;
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (document.getElementById("email") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement)
    .value;
  void (async () => {
    try {
      if (loginError) {
        loginError.hidden = true;
        loginError.textContent = "";
      }
      const token = await login(email, password);
      await setSessionToken(token);
      await renderAuth();
    } catch (error) {
      if (loginError) {
        loginError.hidden = false;
        loginError.textContent =
          error instanceof Error ? error.message : "Login failed";
      }
    }
  })();
});

logoutButton?.addEventListener("click", () => {
  void clearSessionToken().then(() => renderAuth());
});

void renderAuth();

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
