import Module from "node:module";
import path from "node:path";

// Shim server-only before importing any queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalResolve = (Module as any)._resolveFilename;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) {
  if (request === "server-only") {
    return path.resolve(process.cwd(), "scripts/server-only-shim.js");
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { properties } from "../schema/properties";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function main() {
  const { resolveSubLocation } = await import("../queries/properties");

  console.log("🔍 Populating sub_location from apiRaw.Location for all properties...\n");

  // Fetch all properties to populate/correct their sub_locations
  const pzProperties = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      areaSlug: properties.areaSlug,
      subLocation: properties.subLocation,
      apiRaw: properties.apiRaw,
      titleEn: properties.titleEn,
      titleEs: properties.titleEs,
    })
    .from(properties)
    .where(isNotNull(properties.areaSlug));

  console.log(`Found ${pzProperties.length} total properties to process.\n`);

  let updated = 0;
  let skipped = 0;
  const unmapped: string[] = [];

  for (const prop of pzProperties) {
    const apiRaw = prop.apiRaw as Record<string, unknown> | null;
    const location = typeof apiRaw?.Location === "string" ? apiRaw.Location : null;
    const unparsedAddress =
      typeof apiRaw?.UnparsedAddress === "string" ? apiRaw.UnparsedAddress : null;

    // Use the same resolveSubLocation() from the sync pipeline (single source of truth)
    const subLocationSlug = resolveSubLocation(
      location,
      prop.areaSlug as string,
      prop.titleEn,
      prop.titleEs,
      unparsedAddress,
    );

    if (subLocationSlug) {
      if (prop.subLocation !== subLocationSlug) {
        await db
          .update(properties)
          .set({ subLocation: subLocationSlug })
          .where(eq(properties.id, prop.id));

        console.log(
          `  ✅ ${prop.slug}: "${location ?? "None"}" | "${unparsedAddress ?? "None"}" → ${subLocationSlug}`,
        );
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Could not map — log for review
      const displayLoc = location || unparsedAddress || prop.titleEn;
      if (displayLoc && !unmapped.includes(displayLoc)) {
        unmapped.push(displayLoc);
      }
      skipped++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped} (no Location or unmapped)`);
  console.log(`  Total properties: ${pzProperties.length}`);

  if (unmapped.length > 0) {
    console.log(`\n⚠️  Unmapped Location values (${unmapped.length}):`);
    for (const loc of unmapped) {
      console.log(`    - "${loc}"`);
    }
    console.log("\n  Add these to DISTRICT_KEYWORDS in locations.ts if they should be mapped.");
  }

  // Show a count of properties per sub_location after update
  const counts = await db
    .select({
      subLocation: properties.subLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(isNotNull(properties.subLocation))
    .groupBy(properties.subLocation);

  if (counts.length > 0) {
    console.log("\n📍 Properties per sub-location:");
    for (const row of counts) {
      console.log(`    ${row.subLocation}: ${row.count}`);
    }
  }

  await client.end();
  console.log("\n✨ Done!");
}

main().catch((err) => {
  console.error("Failed to populate sub_location:", err);
  process.exit(1);
});
