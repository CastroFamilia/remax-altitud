#!/usr/bin/env node
/**
 * Bundles the standalone TypeScript scripts (migrate, sync) into plain JS
 * that can run with `node` — no tsx required.
 *
 * Usage:  node scripts/build-scripts.mjs
 *
 * Output:
 *   dist/migrate.mjs
 *   dist/run-sync.mjs
 *   dist/test-resend.mjs
 */
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// ── Plugin: resolve "server-only" to an empty shim ──────────────────────────
// Next.js uses the `server-only` package to prevent importing server code
// into client bundles. Outside Next.js this package throws at import-time.
// We replace it with an empty module so the bundled scripts can run standalone.
const serverOnlyShimPlugin = {
  name: "server-only-shim",
  setup(build) {
    build.onResolve({ filter: /^server-only$/ }, () => ({
      path: "server-only",
      namespace: "server-only-shim",
    }));
    build.onLoad({ filter: /.*/, namespace: "server-only-shim" }, () => ({
      contents: "// server-only shim — intentionally empty",
      loader: "js",
    }));
  },
};

// ── Shared build options ────────────────────────────────────────────────────
const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  // Resolve the `@/*` path alias used throughout the codebase
  alias: {
    "@": path.resolve(root, "src"),
  },
  plugins: [serverOnlyShimPlugin],
  // Only keep native-addon packages external — everything else is bundled
  // inline so the scripts are fully self-contained in the runner stage
  // (Next.js standalone only traces deps used by the app, not our scripts).
  external: [
    "sharp",
  ],
  // When esbuild bundles CJS packages (dotenv, postgres, etc.) into ESM,
  // it generates a synthetic `require()` that can't resolve Node built-ins.
  // Inject a real `require` via createRequire so CJS→ESM interop works.
  banner: {
    js: [
      "// Auto-generated — do not edit. Re-run `npm run scripts:build` to regenerate.",
      'import { createRequire as __createRequire } from "node:module";',
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
};

// ── Entries ──────────────────────────────────────────────────────────────────
const entries = [
  {
    entryPoints: [path.resolve(root, "src/lib/db/migrate.ts")],
    outfile: path.resolve(root, "dist/migrate.mjs"),
  },
  {
    entryPoints: [path.resolve(root, "scripts/run-sync.ts")],
    outfile: path.resolve(root, "dist/run-sync.mjs"),
  },
  {
    entryPoints: [path.resolve(root, "scripts/test-resend.ts")],
    outfile: path.resolve(root, "dist/test-resend.mjs"),
  },
];

// ── Build ───────────────────────────────────────────────────────────────────
mkdirSync(path.resolve(root, "dist"), { recursive: true });

for (const entry of entries) {
  await build({ ...shared, ...entry });
  const name = path.basename(entry.outfile);
  console.log(`  ✓ dist/${name}`);
}

console.log("\nDone — scripts are ready to run with `node`.");
