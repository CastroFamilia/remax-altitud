import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "_bmad/**",
      "_bmad-output/**",
      ".agents/**",
      "*.html",
      "main.js",
      "index.css",
      "design-artifacts/**",
      ".worktrees/**",
      "dist/**",
      "scratch/**",
    ],
  },
  {
    rules: {
      // Allow underscore-prefixed identifiers as the convention for intentionally unused vars.
      // e.g. `_agentEmail`, `_locale`, `_err` in catch blocks.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
