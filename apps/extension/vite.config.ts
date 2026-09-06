import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, build } from "vite";
import type { Plugin } from "vite";

const dir = dirname(fileURLToPath(import.meta.url));

function bundleBackground(): Plugin {
  return {
    name: "bundle-background",
    async writeBundle() {
      await build({
        configFile: false,
        logLevel: "error",
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

      copyFileSync(
        resolve(dir, "manifest.json"),
        resolve(dir, "dist/manifest.json"),
      );
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [bundleBackground()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(dir, "popup.html"),
      },
    },
  },
});
