import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyIfMissing(from, to) {
  if (existsSync(to)) return;
  copyFileSync(from, to);
  console.log(`Created ${to}`);
}

copyIfMissing(
  resolve(root, "apps/api/environment.example"),
  resolve(root, "apps/api/.env"),
);
copyIfMissing(
  resolve(root, "apps/web/environment.example"),
  resolve(root, "apps/web/.env"),
);

console.log("Building shared packages and Chrome extension…");
run("npm", ["run", "build", "-w", "@surfguard/shared"]);
run("npm", ["run", "build", "-w", "@surfguard/rules"]);
run("npm", ["run", "build", "-w", "@surfguard/context"]);
run("npm", ["run", "build", "-w", "@surfguard/decision"]);
run("npm", ["run", "build", "-w", "@surfguard/extension"]);

console.log("Applying database migrations…");
const migrate = spawnSync("npm", ["run", "db:deploy", "-w", "@surfguard/api"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

if (migrate.status !== 0) {
  console.log(`
Postgres is not reachable. This machine has no Docker/Homebrew Postgres.

Fastest option (no install): Neon
  1. Open https://console.neon.tech and create a free project
  2. Copy the connection string
  3. Put it in apps/api/.env as DATABASE_URL, for example:
     DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&schema=public
  4. Run: npm run db:deploy -w @surfguard/api

Local option: install Docker Desktop, then:
  docker compose -f infrastructure/docker-compose.yml up -d
  npm run db:deploy -w @surfguard/api

Extension files are ready at apps/extension/dist
`);
  process.exit(1);
}

console.log(`
Setup complete.

1. npm run dev:api
2. npm run dev:web
3. Chrome → chrome://extensions → Developer mode → Load unpacked → apps/extension/dist
`);
