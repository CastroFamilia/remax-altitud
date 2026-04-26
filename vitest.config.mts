import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    // Use React 17+ automatic JSX transform for all TSX files
    jsx: "automatic",
  },
  test: {
    // Default environment for db/sync tests
    environment: "node",
    include: [
      "tests/unit/**/*.spec.ts",
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.spec.tsx",
      "tests/unit/**/*.test.tsx",
    ],
    globals: false,
    // Override environment per glob pattern — component tests need jsdom
    environmentMatchGlobs: [
      ["tests/unit/search/**/*.spec.tsx", "jsdom"],
      ["tests/unit/search/**/*.test.tsx", "jsdom"],
    ],
    // jsdom-setup.ts guards itself — safe to include globally
    setupFiles: ["./tests/setup/jsdom-setup.ts"],
    // Suppress expected log noise from internal sync/api modules.
    // These prefixes are emitted intentionally by retry and error-path
    // code; swallowing them keeps test output clean without hiding real failures.
    onConsoleLog(log) {
      const SUPPRESSED = ["[remax-api]", "[sync]", "[sync/alert]"];
      if (SUPPRESSED.some((prefix) => log.includes(prefix))) return false;
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(
        __dirname,
        "./tests/setup/server-only-shim.ts"
      ),
    },
  },
  // Node-only tests don't need the project's Tailwind/PostCSS pipeline.
  css: { postcss: { plugins: [] } },
});
