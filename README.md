# SurfGuard

AI-powered browser focus agent: web dashboard, Express API, and a Chrome MV3 extension.

## Local test (Chrome extension)

You do **not** publish this to the Chrome Web Store. You load `apps/extension/dist` unpacked.

### 1. One-time tools

- Node.js (this repo already runs on Node 22)
- Chrome
- **Postgres** — this machine does not require a local install. Use **one** of:

**Recommended if you have no Docker:** [Neon](https://console.neon.tech) (free hosted Postgres). Create a project → copy the connection string into `apps/api/.env` as `DATABASE_URL`. Add `?sslmode=require&schema=public` if they are not already on the URL.

**If you prefer local:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
npm run db:up
```

That starts Postgres on `localhost:5432` with user/password/db `surfguard`.

### 2. Env files

`apps/api/.env` (from `apps/api/environment.example`):

| Key | Value for local Chrome testing |
|---|---|
| `PORT` | `4001` |
| `DATABASE_URL` | Neon URL **or** `postgresql://surfguard:surfguard@localhost:5432/surfguard?schema=public` |
| `WEB_ORIGIN` | `http://localhost:5173` |
| `AUTH_COOKIE_NAME` | `surfguard_session` |
| `COOKIE_SECURE` | `false` |
| `SESSION_TTL_MS` | `604800000` |
| `BCRYPT_COST` | `12` |
| `EVENTS_RATE_LIMIT` | `60` |
| `OPENAI_API_KEY` | optional; empty = YouTube shows a fallback nudge |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENAI_TIMEOUT_MS` | `8000` |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |

`apps/web/.env`:

| Key | Value |
|---|---|
| `VITE_API_URL` | `http://localhost:4001` |

The extension has **no `.env`**. It always calls `http://localhost:4001`.

### 3. Commands

```bash
npm install
npm run setup:local
```

`setup:local` builds the extension and applies migrations. If Postgres is missing, it prints how to set Neon, then stop. After `DATABASE_URL` is valid:

```bash
npm run db:deploy
npm run dev:api
npm run dev:web
```

Optional seed user: `dev@surfguard.local` / `dev-password-change-me`

```bash
npm run db:seed -w @surfguard/api
```

### 4. Load the extension

```bash
npm run dev:extension
```

Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select **`apps/extension/dist`** (not `apps/extension`).

### 5. Test YouTube

1. Open `http://localhost:5173`, register (password ≥ 8 chars), create a goal, **start a session**
2. Click the SurfGuard icon → log in with the **same** account
3. Visit `https://www.youtube.com`

## Structure

```text
apps/web          React dashboard
apps/api          Express API
apps/extension    Chrome MV3 extension
packages/shared   Shared types
infrastructure/   Docker Compose Postgres
```
