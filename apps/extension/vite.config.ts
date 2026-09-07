import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, build } from "vite";
import type { Plugin } from "vite";

const dir = dirname(fileURLToPath(import.meta.url));
const shared = resolve(dir, "../../packages/shared/src/index.ts");

function bundleWorkers(): Plugin {
  return {
    name: "bundle-workers",
    async writeBundle() {
      await build({
        configFile: false,
        logLevel: "error",
        resolve: {
          alias: {
            "@surfguard/shared": shared,
          },
        },
        build: {
          emptyOutDir: false,
          outDir: resolve(dir, "dist"),
          lib: {
            entry: resolve(dir, "src/background.ts"),
            formats: ["es"],
            fileName: () => "background.js",
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
      });

      await build({
        configFile: false,
        logLevel: "error",
        resolve: {
          alias: {
            "@surfguard/shared": shared,
          },
        },
        build: {
          emptyOutDir: false,
          outDir: resolve(dir, "dist"),
          lib: {
            entry: resolve(dir, "src/content.ts"),
            formats: ["iife"],
            name: "surfguardContent",
            fileName: () => "content.js",
          },
        },
      });

      copyFileSync(
        resolve(dir, "manifest.json"),
        resolve(dir, "dist/manifest.json"),
      );
    },
  };
}

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@surfguard/shared": shared,
    },
  },
  plugins: [bundleWorkers()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(dir, "popup.html"),
        blocked: resolve(dir, "blocked.html"),
      },
    },
  },
});
