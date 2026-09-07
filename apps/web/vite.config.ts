import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@surfguard/shared": resolve(dir, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
  },
});
