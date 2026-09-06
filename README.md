# SurfGuard

AI-powered browser focus agent. This repository is a modular monolith: a web dashboard, an Express API, and a Chrome Manifest V3 extension, with shared TypeScript types.

This stage is foundation only. Authentication, goals, sessions, AI, queues, and blocking are not implemented yet.

## Structure

```text
apps/web          React + Vite dashboard
apps/api          Express API
apps/extension    Chrome MV3 extension
packages/shared   Shared TypeScript types
infrastructure/   Deploy/compose configs (later)
docs/             Project documentation
```

## Setup

```bash
npm install
cp apps/api/environment.example apps/api/.env
cp apps/web/environment.example apps/web/.env
```

## Commands

```bash
npm run typecheck
npm run lint
npm run build

npm run dev:api
npm run dev:web
```

Build the extension, then load `apps/extension/dist` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).
