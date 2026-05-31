#!/usr/bin/env tsx
/**
 * Console runner for the REMAX CCA sync pipeline.
 *
 * Usage:
 *   npx tsx scripts/run-sync.ts              # Full sync
 *   npx tsx scripts/run-sync.ts --dry-run    # Fetch + diff only (no DB writes)
 *   npx tsx scripts/run-sync.ts --dry-run -v # Dry run with verbose output
 *
 * This bypasses the Next.js "server-only" guard so the pipeline can run
 * directly in the terminal — ideal for debugging, one-off imports, and
 * inspecting the raw API data without spinning up the dev server.
 */

import Module from "node:module";
import * as dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalResolve = (Module as any)._resolveFilename;
const shimPath = path.resolve(__dirname, "server-only-shim.js");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) {
  if (request === "server-only") {
    return shimPath;
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

// ─── 2. Load environment variables ──────────────────────────────────────────
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") }); // fallback

// ─── 3. CLI flags ───────────────────────────────────────────────────────────
const isDryRun = process.argv.includes("--dry-run");
const isVerbose = process.argv.includes("--verbose") || process.argv.includes("-v");

// ─── 4. Helpers ─────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`\x1b[36m[sync]\x1b[0m ${msg}`);
}
function warn(msg: string) {
  console.warn(`\x1b[33m[sync]\x1b[0m ${msg}`);
}
function success(msg: string) {
  console.log(`\x1b[32m[sync]\x1b[0m ${msg}`);
}
function error(msg: string) {
  console.error(`\x1b[31m[sync]\x1b[0m ${msg}`);
}

// ─── 5. Run ─────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  log("REMAX CCA Sync Pipeline — Console Runner");
  log(`Mode: ${isDryRun ? "DRY RUN (no DB writes)" : "FULL SYNC"}`);
  log("─".repeat(50));

  // Validate env vars
  const pzGuid = process.env.PZ_OFFICE_GUID;
  const domGuid = process.env.DOM_OFFICE_GUID;
  const baseUrl = process.env.REMAX_API_BASE_URL;
  const dbUrl = process.env.DATABASE_URL;

  if (!pzGuid || !domGuid || !baseUrl) {
    error("Missing required env vars: REMAX_API_BASE_URL, PZ_OFFICE_GUID, DOM_OFFICE_GUID");
    error("Make sure .env.local is present.");
    process.exit(1);
  }

  log(`API Base URL:  ${baseUrl}`);
  log(`PZ Office:     ${pzGuid}`);
  log(`DOM Office:    ${domGuid}`);
  log(`Database:      ${dbUrl ? "configured" : "⚠️  NOT SET"}`);
  log("");

  if (isDryRun) {
    // ── Dry run: fetch + diff only ────────────────────────────────────────
    const { fetchPropertiesForOffice, fetchAgentsForOffice } = await import(
      "../src/lib/sync/api-client"
    );

    log("Fetching properties from REMAX CCA API...");

    const [pzProps, domProps, pzAgents, domAgents] = await Promise.all([
      fetchPropertiesForOffice(pzGuid),
      fetchPropertiesForOffice(domGuid),
      fetchAgentsForOffice(pzGuid),
      fetchAgentsForOffice(domGuid),
    ]);

    const allProps = [...pzProps.records, ...domProps.records];
    const allAgents = [...pzAgents.records, ...domAgents.records];
    const allParseErrors = [
      ...pzProps.parseErrors,
      ...domProps.parseErrors,
      ...pzAgents.parseErrors,
      ...domAgents.parseErrors,
    ];

    log("");
    success(`Properties fetched:  ${allProps.length}`);
    log(`  └─ PZ office:      ${pzProps.records.length}`);
    log(`  └─ DOM office:     ${domProps.records.length}`);
    success(`Agents fetched:      ${allAgents.length}`);
    log(`  └─ PZ office:      ${pzAgents.records.length}`);
    log(`  └─ DOM office:     ${domAgents.records.length}`);

    if (allParseErrors.length > 0) {
      warn(`Parse errors:        ${allParseErrors.length}`);
      for (const err of allParseErrors) {
        warn(`  └─ [${err.scope}] ${err.apiId ?? "unknown"}: ${err.message}`);
      }
    }

    // ── List ALL agents ───────────────────────────────────────────────────
    log("");
    log("═".repeat(70));
    log("AGENTS");
    log("═".repeat(70));

    log("");
    log(`── Pérez Zeledón Office (${pzAgents.records.length} agents) ──`);
    for (const agent of pzAgents.records) {
      const phone = agent.phone ?? "no phone";
      const email = agent.email ?? "no email";
      const lang = agent.primaryLang ?? "?";
      log(
        `  ${agent.apiId.padEnd(8)} │ ${agent.name.padEnd(28)} │ ${agent.role.padEnd(10)} │ ${lang.padEnd(2)} │ ${phone.padEnd(16)} │ ${email}`,
      );
    }

    log("");
    log(`── Dominical / Altitud Cero Office (${domAgents.records.length} agents) ──`);
    for (const agent of domAgents.records) {
      const phone = agent.phone ?? "no phone";
      const email = agent.email ?? "no email";
      const lang = agent.primaryLang ?? "?";
      log(
        `  ${agent.apiId.padEnd(8)} │ ${agent.name.padEnd(28)} │ ${agent.role.padEnd(10)} │ ${lang.padEnd(2)} │ ${phone.padEnd(16)} │ ${email}`,
      );
    }

    // ── List ALL properties ───────────────────────────────────────────────
    log("");
    log("═".repeat(70));
    log(`PROPERTIES (${allProps.length})`);
    log("═".repeat(70));

    log("");
    log(`── Pérez Zeledón Office (${pzProps.records.length} properties) ──`);
    for (const prop of pzProps.records) {
      const beds = prop.bedrooms ?? "-";
      const baths = prop.bathrooms ?? "-";
      const area = prop.constructionM2 ? `${prop.constructionM2}m²` : "n/a";
      const lot = prop.lotSizeM2 ? `${prop.lotSizeM2.toLocaleString()}m²` : "n/a";
      const loc = prop.location ?? prop.stateProv ?? "";
      const imgs = prop.images.length;
      log(
        `  ${prop.apiId.padEnd(8)} │ $${prop.priceUsd.toLocaleString().padEnd(12)} │ ${prop.propertyTypeEn.padEnd(14)} │ ${String(beds).padEnd(2)}bd/${String(baths).padEnd(2)}ba │ ${area.padEnd(8)} │ lot ${lot.padEnd(10)} │ ${String(imgs).padEnd(3)}img │ ${loc}`,
      );
      if (isVerbose) {
        log(`           │ ${prop.titleEn}`);
      }
    }

    log("");
    log(`── Dominical / Altitud Cero Office (${domProps.records.length} properties) ──`);
    for (const prop of domProps.records) {
      const beds = prop.bedrooms ?? "-";
      const baths = prop.bathrooms ?? "-";
      const area = prop.constructionM2 ? `${prop.constructionM2}m²` : "n/a";
      const lot = prop.lotSizeM2 ? `${prop.lotSizeM2.toLocaleString()}m²` : "n/a";
      const loc = prop.location ?? prop.stateProv ?? "";
      const imgs = prop.images.length;
      log(
        `  ${prop.apiId.padEnd(8)} │ $${prop.priceUsd.toLocaleString().padEnd(12)} │ ${prop.propertyTypeEn.padEnd(14)} │ ${String(beds).padEnd(2)}bd/${String(baths).padEnd(2)}ba │ ${area.padEnd(8)} │ lot ${lot.padEnd(10)} │ ${String(imgs).padEnd(3)}img │ ${loc}`,
      );
      if (isVerbose) {
        log(`           │ ${prop.titleEn}`);
      }
    }
  } else {
    // ── Full sync ─────────────────────────────────────────────────────────
    if (!dbUrl) {
      error(
        "DATABASE_URL is required for full sync. Use --dry-run to skip DB writes.",
      );
      process.exit(1);
    }

    const { runSyncPipeline } = await import("../src/lib/sync/pipeline");

    log("Running full sync pipeline...");
    log("");

    try {
      const result = await runSyncPipeline({
        onProgress: (event) => {
          switch (event.type) {
            case "info":
              log(event.message);
              break;
            case "agent_upsert":
              log(`  [agent]    ${event.apiId.padEnd(8)} │ ${event.name}`);
              break;
            case "property_upsert": {
              const color = event.action === "create" ? "\x1b[32m" : "\x1b[33m"; // Green for new, Yellow for update
              const action = event.action.toUpperCase().padEnd(6);
              log(
                `  [property] ${color}${action}\x1b[0m │ ${event.apiId.padEnd(8)} │ ${event.title}`,
              );
              break;
            }
            case "property_optimize":
              if (isVerbose) {
                log(`  [images]   ${event.apiId.padEnd(8)} │ Optimized ${event.imageCount} images`);
              }
              break;
            case "property_translate":
              if (isVerbose) {
                log(`  [translate] ${event.apiId.padEnd(7)} │ Translation updated`);
              }
              break;
            case "property_tag":
              if (isVerbose) {
                log(`  [tagging]   ${event.apiId.padEnd(7)} │ Lifestyle tags updated`);
              }
              break;
          }
        },
      });

      log("");
      log("═".repeat(50));
      success("Sync completed!");
      log("═".repeat(50));
      log(`  Status:              ${result.status}`);
      log(`  Properties fetched:  ${result.propertiesFetched}`);
      log(`  Properties created:  ${result.propertiesCreated}`);
      log(`  Properties updated:  ${result.propertiesUpdated}`);
      log(`  Properties removed:  ${result.propertiesRemoved}`);
      log(`  Agents synced:       ${result.agentsSynced}`);
      log(`  Images optimized:    ${result.imagesOptimized}`);
      log(`  Translations queued: ${result.translationsQueued}`);
      log(`  Tags queued:         ${result.tagsQueued}`);
      log(`  Errors:              ${result.errorCount}`);
    } catch (err) {
      error("Pipeline failed!");
      error(err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error(err.stack);
      }
      process.exit(1);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log("");
  log(`Done in ${elapsed}s`);
}

main().catch((err) => {
  error("Unexpected error:");
  console.error(err);
  process.exit(1);
});
