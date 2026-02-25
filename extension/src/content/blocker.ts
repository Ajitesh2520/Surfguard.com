// extension/src/content/blocker.ts

(async function () {
  // Ignore internal browser pages
  if (
    location.protocol.startsWith("chrome") ||
    location.protocol.startsWith("extension") ||
    location.protocol.startsWith("file")
  ) {
    return;
  }

  const domain = location.hostname.replace(/^www\./, "");

  const {
    categoryCache = {},
    blockedCategories = {},
    userGoal = ""
  } = await chrome.storage.local.get([
    "categoryCache",
    "blockedCategories",
    "userGoal"
  ]);

  const cache = categoryCache as Record<string, string>;
  const blocked = blockedCategories as Record<string, boolean>;
  const goal = userGoal as string;
  const category = cache[domain];

  if (!category) return;
  if (!blocked[category]) return;

  injectOverlay(category, goal);
})();

function injectOverlay(category: string, goal: string) {
  // Prevent double injection
  if (document.getElementById("focus-ai-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "focus-ai-overlay";

  overlay.innerHTML = `
    <div class="focus-card">
      <h1>🚫 ${category} Blocked</h1>
      <p>You’ve exceeded your daily time limit.</p>

      ${goal ? `<p class="goal">🎯 Goal: ${goal}</p>` : ""}

      <p class="sub">Come back tomorrow. Stay focused 💪</p>
    </div>
  `;

  const style = document.createElement("style");
  style.innerHTML = `
    #focus-ai-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 15, 15, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .focus-card {
      background: #111;
      color: #fff;
      padding: 32px 40px;
      border-radius: 12px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }

    .focus-card h1 {
      font-size: 22px;
      margin-bottom: 12px;
    }

    .focus-card p {
      font-size: 15px;
      opacity: 0.85;
      margin: 8px 0;
    }

    .focus-card .goal {
      margin-top: 14px;
      font-weight: 600;
      opacity: 1;
    }

    .focus-card .sub {
      margin-top: 18px;
      font-size: 14px;
      opacity: 0.6;
    }
  `;

  document.documentElement.appendChild(style);
  document.body.appendChild(overlay);

  // Disable interaction underneath
  document.body.style.overflow = "hidden";
}