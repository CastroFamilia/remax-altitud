import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
import { properties } from "../schema/properties";
import { resolveSubLocation } from "../queries/properties";

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
  console.log("🔍 Populating sub_location from apiRaw.Location for Pérez Zeledón properties...\n");

  // Fetch all PZ properties that don't have a sub_location yet
  const pzProperties = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      areaSlug: properties.areaSlug,
      subLocation: properties.subLocation,
      apiRaw: properties.apiRaw,
      titleEn: properties.titleEn,
    })
    .from(properties)
    .where(
      and(
        eq(properties.areaSlug, "perez-zeledon"),
        isNull(properties.subLocation),
      ),
    );

  console.log(`Found ${pzProperties.length} PZ properties without sub_location.\n`);

  let updated = 0;
  let skipped = 0;
  const unmapped: string[] = [];

  for (const prop of pzProperties) {
    const apiRaw = prop.apiRaw as Record<string, unknown> | null;
    const location = typeof apiRaw?.Location === "string" ? apiRaw.Location : null;

    if (!location) {
      skipped++;
      continue;
    }

    // Use the same resolveSubLocation() from the sync pipeline (single source of truth)
    const subLocationSlug = resolveSubLocation(location, "perez-zeledon");

    if (subLocationSlug) {
      await db
        .update(properties)
        .set({ subLocation: subLocationSlug })
        .where(eq(properties.id, prop.id));

      console.log(`  ✅ ${prop.slug}: "${location}" → ${subLocationSlug}`);
      updated++;
    } else {
      // Could not map — log for review
      if (!unmapped.includes(location)) {
        unmapped.push(location);
      }
      skipped++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped} (no Location or unmapped)`);
  console.log(`  Total PZ properties: ${pzProperties.length}`);

  if (unmapped.length > 0) {
    console.log(`\n⚠️  Unmapped Location values (${unmapped.length}):`);
    for (const loc of unmapped) {
      console.log(`    - "${loc}"`);
    }
    console.log("\n  Add these to PZ_DISTRICT_KEYWORDS in properties.ts if they should be mapped.");
  }

  // Show a count of properties per sub_location after update
  const counts = await db
    .select({
      subLocation: properties.subLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(properties)
    .where(
      and(
        eq(properties.areaSlug, "perez-zeledon"),
        isNotNull(properties.subLocation),
      ),
    )
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
