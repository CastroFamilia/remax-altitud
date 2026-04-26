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
    // Run the jsdom setup file before each jsdom component test
    setupFiles: ["./tests/setup/jsdom-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/setup/server-only-shim.ts"),
    },
  },
  // Node-only tests don't need the project's Tailwind/PostCSS pipeline.
  css: { postcss: { plugins: [] } },
});
