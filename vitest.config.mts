import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Suppress expected log noise from internal sync/api modules.
 * These prefixes are emitted intentionally by retry and error-path
 * code; swallowing them keeps test output clean without hiding real failures.
 */
function onConsoleLog(log: string) {
  const SUPPRESSED = ["[remax-api]", "[sync]", "[sync/alert]"];
  if (SUPPRESSED.some((prefix) => log.includes(prefix))) return false;
}

const sharedResolve = {
  alias: {
    "@": path.resolve(import.meta.dirname, "./src"),
    "server-only": path.resolve(
      import.meta.dirname,
      "./tests/setup/server-only-shim.ts"
    ),
  },
};

const sharedOxc = {
  // Use React 17+ automatic JSX transform for all TSX files
  // (Vitest 4.x uses oxc via rolldown — esbuild.jsx is ignored)
  jsx: { runtime: "automatic" as const },
};

export default defineConfig({
  oxc: sharedOxc,
  resolve: sharedResolve,
  // Node-only tests don't need the project's Tailwind/PostCSS pipeline.
  css: { postcss: { plugins: [] } },
  test: {
    globals: false,
    onConsoleLog,
    // Vitest 4 projects replace the deprecated environmentMatchGlobs.
    // Split into two projects: node (for .ts) and jsdom (for .tsx React tests).
    projects: [
      {
        oxc: sharedOxc,
        resolve: sharedResolve,
        css: { postcss: { plugins: [] } },
        test: {
          name: "node",
          environment: "node",
          include: [
            "tests/unit/**/*.spec.ts",
            "tests/unit/**/*.test.ts",
          ],
          onConsoleLog,
        },
      },
      {
        oxc: sharedOxc,
        resolve: sharedResolve,
        css: { postcss: { plugins: [] } },
        test: {
          name: "jsdom",
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              // jsdom requires a non-opaque origin for localStorage/sessionStorage
              url: "http://localhost:3000",
            },
          },
          include: [
            "tests/unit/**/*.spec.tsx",
            "tests/unit/**/*.test.tsx",
          ],
          setupFiles: ["./tests/setup/jsdom-setup.ts"],
          onConsoleLog,
        },
      },
    ],
  },
});
