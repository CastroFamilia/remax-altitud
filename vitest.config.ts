import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.spec.ts", "tests/unit/**/*.test.ts"],
    globals: false,
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
